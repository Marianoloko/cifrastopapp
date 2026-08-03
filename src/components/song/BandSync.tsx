import { useEffect, useRef, useState } from "react";
import { Radio, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export type BandState = { songId: string; semitones: number; scrollY: number };

export function useBandSync(onRemote: (state: BandState) => void) {
  const [room, setRoom] = useState<string | null>(null);
  const [leader, setLeader] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const handler = useRef(onRemote);
  handler.current = onRemote;

  useEffect(() => {
    if (!room) return;
    const channel = supabase.channel(`band-${room}`, { config: { broadcast: { self: false } } });
    channel.on("broadcast", { event: "state" }, ({ payload }) => {
      handler.current(payload as BandState);
    });
    void channel.subscribe();
    channelRef.current = channel;
    return () => {
      void supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [room]);

  const broadcast = (state: BandState) => {
    if (!room || !leader) return;
    void channelRef.current?.send({ type: "broadcast", event: "state", payload: state });
  };

  return { room, setRoom, leader, setLeader, broadcast };
}

export function BandSyncPanel({
  room,
  leader,
  onJoin,
  onLeave,
  onLeaderChange,
}: {
  room: string | null;
  leader: boolean;
  onJoin: (code: string) => void;
  onLeave: () => void;
  onLeaderChange: (leader: boolean) => void;
}) {
  const [code, setCode] = useState("");

  return (
    <div className="space-y-2 rounded-xl border bg-card p-3">
      <div className="flex items-center gap-2">
        <Users className="size-4 text-primary" aria-hidden="true" />
        <p className="text-xs font-bold text-foreground">Sincronização em banda</p>
      </div>
      {room ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Conectado à sala <strong className="font-mono text-foreground">{room}</strong>
            {leader ? " como líder (você comanda tom e rolagem)." : " como músico (você segue o líder)."}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={leader ? "default" : "outline"}
              onClick={() => onLeaderChange(!leader)}
            >
              <Radio className="size-4" aria-hidden="true" />
              {leader ? "Sou o líder" : "Assumir liderança"}
            </Button>
            <Button size="sm" variant="ghost" onClick={onLeave}>
              Sair da sala
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase().slice(0, 8))}
            placeholder="CÓDIGO DA SALA"
            className={cn("h-9 font-mono text-xs uppercase")}
          />
          <Button size="sm" onClick={() => code.trim() && onJoin(code.trim())}>
            Entrar
          </Button>
        </div>
      )}
    </div>
  );
}
