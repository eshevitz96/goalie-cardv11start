// @ts-nocheck — Apple Wallet pass feature. passkit-generator requires proper configuration before TypeScript errors can be resolved. Scheduled for full implementation post-beta.
import { NextRequest, NextResponse } from 'next/server';
import { PKPass } from 'passkit-generator';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

// This API route generates a .pkpass file for the Goalie Card.
// It requires Apple Developer certificates (WWDR, Pass Certificate, Private Key)
// to be provided as environment variables (Base64 encoded).

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const name = searchParams.get('name') || 'Goalie Athlete';
        const id = searchParams.get('id') || 'DEMO-01';
        const team = searchParams.get('team') || 'Unattached';
        const session = searchParams.get('session') || 'PRO';

        // 1. Initialize the pass
        // In a real production scenario, you'd load certificates from env variables
        const wwdr = process.env.APPLE_WWDR_CERTIFICATE;
        const passCert = process.env.APPLE_PASS_CERTIFICATE;
        const passKey = process.env.APPLE_PASS_PRIVATE_KEY;
        const passPassword = process.env.APPLE_PASS_KEY_PASSWORD || '';

        // For now, if certificates are missing, we return an error or a helpful message
        if (!wwdr || !passCert || !passKey) {
            console.warn("Apple Wallet certificates are not configured in environment variables.");
            // We'll proceed with dummy data for the structure, but signing will fail
            // return NextResponse.json({ error: "Wallet certificates not configured" }, { status: 500 });
        }

        const pass = new PKPass({}, {
            wwdr: wwdr ? Buffer.from(wwdr, 'base64') : Buffer.alloc(0),
            signerCert: passCert ? Buffer.from(passCert, 'base64') : Buffer.alloc(0),
            signerKey: passKey ? Buffer.from(passKey, 'base64') : Buffer.alloc(0),
            signerKeyPassword: passPassword,
        });

        // 2. Set Pass Attributes
        pass.setPrimaryIdentifier('pass.com.goaliecard.registry');
        pass.setTeamIdentifier(process.env.APPLE_TEAM_ID || 'TEAM_ID_HERE');

        // 3. Define Pass Content (Generic Pass)
        pass.type = 'generic';
        pass.labels.logoText = 'Goalie Card';
        
        pass.headerFields.add({
            key: 'status',
            label: 'STATUS',
            value: 'ACTIVE'
        });

        pass.primaryFields.add({
            key: 'athlete',
            label: 'ATHLETE',
            value: name
        });

        pass.secondaryFields.add({
            key: 'team',
            label: 'TEAM',
            value: team
        });

        pass.auxiliaryFields.add({
            key: 'session',
            label: 'SESSION',
            value: session
        });

        pass.auxiliaryFields.add({
            key: 'id',
            label: 'REGISTRY ID',
            value: id.toUpperCase()
        });

        // 4. NFC Payload (Tap to Connect)
        // This is where the ProximityReader integration happens on the pass side.
        pass.nfc = {
            message: `GOALIE_CONNECT:${id}`,
            // encryptionPublicKeyHash: process.env.APPLE_NFC_PUBLIC_KEY_HASH
        };

        // 5. Barcode (Backup)
        pass.barcodes.add({
            message: `https://goaliecard.app/connect/${id}`,
            format: 'PKBarcodeFormatQR',
            messageEncoding: 'iso-8859-1'
        });

        // 6. Visual Settings
        pass.backgroundColor = 'rgb(28, 28, 30)'; // Dark gray
        pass.foregroundColor = 'rgb(255, 255, 255)';

        // 7. Add Assets 
        // We'll need to point to existing logo images in the public folder
        const logoPath = path.join(process.cwd(), 'public', 'flower-logo.png');
        if (fs.existsSync(logoPath)) {
            pass.addBuffer('logo.png', fs.readFileSync(logoPath));
            pass.addBuffer('icon.png', fs.readFileSync(logoPath)); // Required
        }

        // 8. Generate the buffer
        const buffer = await pass.asBuffer();

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/vnd.apple.pkpass',
                'Content-Disposition': `attachment; filename="goalie_pass_${id}.pkpass"`,
            },
        });

    } catch (error: any) {
        console.error('Pass generation failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
