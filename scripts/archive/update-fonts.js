const fs = require('fs');
const path = require('path');

const files = [
    'src/app/login/page.tsx',
    'src/components/activate/ActivatePasswordStep.tsx',
    'src/components/activate/ActivateEmailStep.tsx',
    'src/components/activate/ActivateCreateStep.tsx',
    'src/components/activate/ActivateBaselineStep.tsx',
    'src/components/activate/ActivateTermsStep.tsx',
    'src/components/activate/ActivateLookupResult.tsx',
    'src/components/activate/ActivateIdentityStep.tsx',
    'src/components/activate/ActivateVerifyReviewStep.tsx',
    'src/components/activate/ActivateSecurityStep.tsx',
    'src/components/activate/ActivateProfileWizard.tsx',
    'src/components/activate/ActivateReviewStep.tsx',
    'src/components/auth/steps/AuthEmailStep.tsx',
    'src/components/auth/steps/AuthTermsStep.tsx',
    'src/components/auth/steps/AuthRoutingStep.tsx',
    'src/components/auth/steps/AuthOtpStep.tsx',
    'src/components/auth/steps/AuthInfoStep.tsx',
    'src/components/auth/steps/AuthBirthdayStep.tsx'
];

function toTitleCase(str) {
    if(str === str.toUpperCase()) {
        return str.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
    }
    return str;
}

files.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove subheaders in activate and login forms:
    // Any <p> or <span className="text-muted-foreground... that strictly follows an </h1> or </h2> closing tag 
    // inside a standard flex/div header container.
    // Instead of risking regex breakage, let's target the exact known ones.

    // 1. In src/app/login/page.tsx:
    if (file === 'src/app/login/page.tsx') {
        content = content.replace(
            /(<h1.*?<\/h1>)\s*<p className="text-muted-foreground font-medium">.*?<\/p>/s,
            '$1'
        );
        content = content.replace('className="text-4xl font-black italic tracking-tighter text-foreground mb-2"', 'className="text-4xl md:text-5xl font-black tracking-tighter text-foreground"');
        content = content.replace('GOALIE <span className="text-primary">CARD</span>', 'Goalie Card');
    }

    // 2. In Activate headers: Look for uppercase text and text styling
    content = content.replace(/className="([^"]*(?:text-[2-5]xl)[^"]*)"([^>]*)>(.*?)<\/(h[1-6])/g, (match, classes, attrs, innerText, tag) => {
        // Enforce styling
        let newClasses = classes
            .replace(/\b(?:text-[2-5]xl|md:text-[3-6]xl|uppercase|italic|font-bold|tracking-tight|tracking-tighter|text-foreground|mb-2|mb-4)\b/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        
        // Strip out HTML tags for testing, check if it's pure text uppercase
        let newText = innerText;
        if (!newText.includes('<') && newText === newText.toUpperCase()) {
            newText = toTitleCase(newText);
        }

        return `className="text-2xl md:text-3xl font-black text-foreground tracking-tighter ${newClasses}"${attrs}>${newText}</${tag}`;
    });

    // 3. Strip <p> subheaders directly underneath Activate </h1> closures:
    if (file.includes('activate')) {
        // Look for </div> closure right after an h1/h2 with no subheader by deleting the <p>
        content = content.replace(/(<\/h[1-6]>)\s*<p className="([^"]*text-muted-foreground[^"]*|[^"]*text-sm[^"]*|[^"]*text-xs[^"]*)">.*?<\/p>/gs, '$1');
    }

    fs.writeFileSync(filePath, content);
});

console.log('Update Complete');
