
import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { addEvent } from '@/app/events/actions';
import { useToast } from '@/context/ToastContext';

interface AddGlobalEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function AddGlobalEventModal({ isOpen, onClose, onSuccess }: AddGlobalEventModalProps) {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        date: '',
        location: '',
        sport: 'Hockey', // Default
        price: 0,
        image: 'from-blue-600 to-blue-800' // Default gradient
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await addEvent({
                name: formData.name,
                date: new Date(formData.date).toISOString(),
                location: formData.location,
                sport: formData.sport,
                price: Number(formData.price),
                image: formData.image
            });

            if (result.success) {
                toast.success('Global Event Created!');
                onSuccess();
                onClose();
                setFormData({ name: '', date: '', location: '', sport: 'Hockey', price: 0, image: 'from-blue-600 to-blue-800' });
            } else {
                toast.error('Failed: ' + result.error);
            }
        } catch (err: any) {
            toast.error('Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Global Event">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg text-sm text-blue-400 mb-4">
                    <strong>Global Event:</strong> This will appear on the dashboard of ALL goalies who play this sport.
                </div>

                <Input
                    label="Event Name"
                    placeholder="e.g. Summer Elite Camp"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                />

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Date & Time"
                        type="datetime-local"
                        value={formData.date}
                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                        required
                    />
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground ml-1">Sport</label>
                        <select
                            className="input-standard w-full"
                            value={formData.sport}
                            onChange={e => setFormData({ ...formData, sport: e.target.value })}
                        >
                            <option value="Hockey">Hockey</option>
                            <option value="Lacrosse">Lacrosse</option>
                            <option value="Soccer">Soccer</option>
                        </select>
                    </div>
                </div>

                <Input
                    label="Location"
                    placeholder="e.g. Rinks at Exeter"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    required
                />

                <Input
                    label="Price ($)"
                    type="number"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                />

                <Button
                    type="submit"
                    variant="primary"
                    className="w-full bg-blue-600 hover:bg-blue-500"
                    disabled={loading}
                >
                    {loading ? 'Creating...' : 'Create Event'}
                </Button>
            </form>
        </Modal>
    );
}
