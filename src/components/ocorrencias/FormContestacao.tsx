import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { api } from "@/services/api";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface FormContestacaoProps {
    atividadeId: number;
    atividadeDescricao: string;
    isOpen: boolean;
    onClose: () => void;
}

export function FormContestacao({
    atividadeId,
    atividadeDescricao,
    isOpen,
    onClose
}: FormContestacaoProps) {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        nome_morador: "",
        contato: "",
        mensagem: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await api.contestAtividade(atividadeId, formData);
            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setFormData({ nome_morador: "", contato: "", mensagem: "" });
            }, 2000);
        } catch (err: any) {
            setError(err.message || "Erro ao enviar contestação");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Contestar Atividade</DialogTitle>
                    <DialogDescription className="text-sm">
                        {atividadeDescricao}
                    </DialogDescription>
                </DialogHeader>

                {success ? (
                    <div className="flex flex-col items-center justify-center py-8">
                        <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                        <p className="text-lg font-medium">Contestação enviada!</p>
                        <p className="text-muted-foreground text-sm">Nossa equipe irá analisar sua mensagem.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="nome">Seu Nome *</Label>
                            <Input
                                id="nome"
                                value={formData.nome_morador}
                                onChange={(e) => setFormData({ ...formData, nome_morador: e.target.value })}
                                placeholder="Digite seu nome"
                                required
                                minLength={2}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="contato">Contato (opcional)</Label>
                            <Input
                                id="contato"
                                value={formData.contato}
                                onChange={(e) => setFormData({ ...formData, contato: e.target.value })}
                                placeholder="Telefone ou e-mail para retorno"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="mensagem">Mensagem *</Label>
                            <Textarea
                                id="mensagem"
                                value={formData.mensagem}
                                onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
                                placeholder="Descreva o motivo da contestação..."
                                required
                                minLength={10}
                                rows={4}
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-destructive text-sm">
                                <AlertCircle className="h-4 w-4" />
                                {error}
                            </div>
                        )}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Enviar Contestação
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
