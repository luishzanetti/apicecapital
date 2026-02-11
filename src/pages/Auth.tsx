import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';

export default function Auth() {
  const navigate = useNavigate();
  const { signIn, signUp, resetPassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');

  // Reset password form state
  const [resetEmail, setResetEmail] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error('Preencha todos os campos');
      return;
    }

    setLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setLoading(false);

    if (error) {
      toast.error(getAuthErrorMessage(error.message));
    } else {
      navigate('/splash', { replace: true });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerEmail || !registerPassword || !registerConfirmPassword) {
      toast.error('Preencha todos os campos');
      return;
    }
    if (registerPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    if (registerPassword !== registerConfirmPassword) {
      toast.error('As senhas nao coincidem');
      return;
    }

    setLoading(true);
    const { error } = await signUp(registerEmail, registerPassword);
    setLoading(false);

    if (error) {
      toast.error(getAuthErrorMessage(error.message));
    } else {
      toast.success('Conta criada! Verifique seu e-mail para confirmar.');
      navigate('/splash', { replace: true });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error('Informe seu e-mail');
      return;
    }

    setLoading(true);
    const { error } = await resetPassword(resetEmail);
    setLoading(false);

    if (error) {
      toast.error(getAuthErrorMessage(error.message));
    } else {
      toast.success('E-mail de recuperacao enviado! Verifique sua caixa de entrada.');
      setShowResetPassword(false);
    }
  };

  if (showResetPassword) {
    return (
      <div className="min-h-screen bg-background flex flex-col px-6 py-12 safe-top">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1 flex flex-col"
        >
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl apice-gradient-primary flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 40 40" fill="none" className="text-white">
                <path d="M20 4L36 34H4L20 4Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" fill="none" />
              </svg>
            </div>
            <span className="font-semibold text-lg">Apice</span>
          </div>

          <h1 className="text-2xl font-bold mb-2">Recuperar senha</h1>
          <p className="text-muted-foreground text-sm mb-8">
            Informe seu e-mail para receber um link de recuperacao.
          </p>

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Button variant="premium" size="lg" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enviar link de recuperacao'}
            </Button>
          </form>

          <button
            onClick={() => setShowResetPassword(false)}
            className="mt-6 text-sm text-primary hover:underline text-center"
          >
            Voltar ao login
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-12 safe-top">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-1 flex flex-col"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 rounded-xl apice-gradient-primary flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 40 40" fill="none" className="text-white">
              <path d="M20 4L36 34H4L20 4Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
          <span className="font-semibold text-lg">Apice</span>
        </div>

        <h1 className="text-2xl font-bold mb-2">Bem-vindo ao Apice</h1>
        <p className="text-muted-foreground text-sm mb-8">
          Sua plataforma de investimento cripto inteligente.
        </p>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="login" className="flex-1">Entrar</TabsTrigger>
            <TabsTrigger value="register" className="flex-1">Criar conta</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Sua senha"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Button variant="premium" size="lg" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Entrar
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>

              <button
                type="button"
                onClick={() => setShowResetPassword(true)}
                className="w-full text-sm text-muted-foreground hover:text-primary transition-colors text-center"
              >
                Esqueceu sua senha?
              </button>
            </form>
          </TabsContent>

          <TabsContent value="register">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="Minimo 6 caracteres"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-confirm">Confirmar senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="register-confirm"
                    type="password"
                    placeholder="Repita a senha"
                    value={registerConfirmPassword}
                    onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Button variant="premium" size="lg" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Criar conta
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Ao criar uma conta, voce concorda com nossos termos de uso.
              </p>
            </form>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}

function getAuthErrorMessage(message: string): string {
  if (message.includes('Invalid login credentials')) {
    return 'E-mail ou senha incorretos';
  }
  if (message.includes('Email not confirmed')) {
    return 'Confirme seu e-mail antes de fazer login';
  }
  if (message.includes('User already registered')) {
    return 'Este e-mail ja esta cadastrado';
  }
  if (message.includes('Password should be at least')) {
    return 'A senha deve ter pelo menos 6 caracteres';
  }
  if (message.includes('rate limit')) {
    return 'Muitas tentativas. Aguarde um momento e tente novamente';
  }
  return 'Ocorreu um erro. Tente novamente.';
}
