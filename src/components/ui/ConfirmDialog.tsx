import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
    loading?: boolean;
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'Confirmer',
    cancelLabel = 'Annuler',
    variant = 'danger',
    loading = false,
}: ConfirmDialogProps) {
    const iconColors = {
        danger: 'text-rose-600 bg-rose-100',
        warning: 'text-amber-600 bg-amber-100',
        info: 'text-sky-600 bg-sky-100',
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="sm" showClose={false}>
            <div className="text-center">
                <div className={`w-12 h-12 rounded-full ${iconColors[variant]} flex items-center justify-center mx-auto mb-4`}>
                    <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-600 mb-6">{message}</p>
                <div className="flex gap-3 justify-center">
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        {cancelLabel}
                    </Button>
                    <Button
                        variant={variant === 'danger' ? 'danger' : 'primary'}
                        onClick={onConfirm}
                        loading={loading}
                    >
                        {confirmLabel}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
