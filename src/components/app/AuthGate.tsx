import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { LockKeyhole } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type AuthGateValue = {
  /** Retorna true quando há conta. Sem conta, abre o convite de cadastro. */
  requireAccount: (action?: string) => boolean;
  signedIn: boolean;
};

const AuthGateContext = createContext<AuthGateValue>({
  requireAccount: () => true,
  signedIn: true,
});

export function useAuthGate() {
  return useContext(AuthGateContext);
}

export function AuthGateProvider({
  signedIn,
  children,
}: {
  signedIn: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<string | null>(null);

  const requireAccount = useCallback(
    (nextAction?: string) => {
      if (signedIn) return true;
      setAction(nextAction ?? null);
      setOpen(true);
      return false;
    },
    [signedIn],
  );

  const value = useMemo(() => ({ requireAccount, signedIn }), [requireAccount, signedIn]);

  return (
    <AuthGateContext.Provider value={value}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[20rem] rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <LockKeyhole className="size-4 text-primary" aria-hidden="true" />
              Crie sua conta grátis
            </DialogTitle>
            <DialogDescription className="text-sm">
              🔓 Crie sua conta grátis em 10s para salvar suas cifras e ter seu acervo offline! (3
              Meses VIP de presente)
              {action ? (
                <span className="mt-2 block text-xs text-muted-foreground">
                  Ação bloqueada: {action}
                </span>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:flex-col">
            <Button asChild className="w-full">
              <Link to="/auth" search={{ redirect: "/app" }}>
                Criar conta grátis
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link to="/auth" search={{ redirect: "/app" }}>
                Já tenho conta
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthGateContext.Provider>
  );
}
