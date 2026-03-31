import { useState } from 'react';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Loader2 } from 'lucide-react';

// Input validation schema — prevents injection and ensures data integrity
const transactionSchema = z.object({
    type: z.enum(['buy', 'sell']),
    asset: z.string()
        .min(1, 'Asset symbol is required')
        .max(10, 'Asset symbol too long')
        .regex(/^[A-Z0-9]+$/i, 'Asset symbol must be alphanumeric only'),
    amount: z.string()
        .refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Amount must be a positive number')
        .refine((v) => Number(v) <= 1_000_000_000, 'Amount exceeds maximum'),
    price: z.string()
        .refine((v) => !isNaN(Number(v)) && Number(v) >= 0, 'Price must be a non-negative number')
        .refine((v) => Number(v) <= 1_000_000_000, 'Price exceeds maximum'),
    date: z.string()
        .refine((v) => !isNaN(Date.parse(v)), 'Invalid date'),
});

interface AddTransactionModalProps {
    onTransactionAdded: () => void;
}

export function AddTransactionModal({ onTransactionAdded }: AddTransactionModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    // Form State
    const [type, setType] = useState<'buy' | 'sell'>('buy');
    const [asset, setAsset] = useState('BTC');
    const [amount, setAmount] = useState('');
    const [price, setPrice] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Validate all inputs with Zod before sending to database
            const validation = transactionSchema.safeParse({ type, asset, amount, price, date });
            if (!validation.success) {
                const firstError = validation.error.errors[0]?.message || 'Invalid input';
                toast({
                    title: "Validation Error",
                    description: firstError,
                    variant: "destructive"
                });
                return;
            }

            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;
            if (!user) throw new Error("Not authenticated");

            const sanitizedAsset = validation.data.asset.toUpperCase().replace(/[^A-Z0-9]/g, '');

            const { error } = await supabase.from('transactions').insert({
                user_id: user.id,
                type: validation.data.type,
                asset_symbol: sanitizedAsset,
                amount: Number(validation.data.amount),
                price_per_unit: Number(validation.data.price),
                date: new Date(validation.data.date).toISOString(),
            });

            if (error) throw error;

            toast({
                title: "Transaction added",
                description: `Successfully recorded ${type} ${Number(amount).toFixed(4)} ${sanitizedAsset}`,
            });

            setOpen(false);
            setAmount('');
            setPrice('');
            onTransactionAdded();

        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || 'An unexpected error occurred',
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="default" size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Transaction
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-border">
                <DialogHeader>
                    <DialogTitle>Add Transaction</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Type</Label>
                            <Select value={type} onValueChange={(v: any) => setType(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="buy">Buy</SelectItem>
                                    <SelectItem value="sell">Sell</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Asset</Label>
                            <Input
                                placeholder="BTC"
                                value={asset}
                                onChange={(e) => setAsset(e.target.value)}
                                className="uppercase"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Amount</Label>
                            <Input
                                type="number"
                                step="any"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Price per Unit ($)</Label>
                            <Input
                                type="number"
                                step="any"
                                placeholder="0.00"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Date</Label>
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Save Transaction
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
