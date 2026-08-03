export type StarterSong = {
  title: string;
  artist: string;
  key: string;
  capo: string;
  bpm: number;
  media_url: string;
  body: string;
};

export const STARTER_SONGS: StarterSong[] = [
  {
    title: "Evidências",
    artist: "Chitãozinho & Xororó",
    key: "E",
    capo: "Sem Capo",
    bpm: 92,
    media_url: "https://www.youtube.com/watch?v=ePjtnSPFWK8",
    body: `[Intro]
E|-----0-----0-----|-----0-----0-----|
B|---0---0---0---0-|---0---0---0---0-|
G|-1-------1-------|-1-------1-------|
D|-----------------|-----------------|
A|-----------------|-----------------|
E|-0---------------|-0---------------|

[Primeira Parte]
E              C#m
(verso 1 - siga a melodia)
A              B
(resposta do verso)

[Refrão]
A        B        C#m
(refrão - abra a voz aqui)
A        B        E
(final da frase)

[Solo]
C#m   A   B   E

[Final]
A   B   E`,
  },
  {
    title: "Anunciação",
    artist: "Alceu Valença",
    key: "G",
    capo: "Sem Capo",
    bpm: 120,
    media_url: "https://www.youtube.com/watch?v=cKQbGm09rd8",
    body: `[Ritmo sugerido]
Baião / xote — batida: baixo, cima, baixo-cima (120 BPM)

[Intro]
G   D   Em   C

[Primeira Parte]
G                 D
(verso — voz leve, sem forçar)
Em                C
(resposta do verso)

[Refrão]
G        D
(refrão aberto)
Em       C        G
(final da frase)

[Passagem]
C   D   G`,
  },
  {
    title: "Tempo Perdido",
    artist: "Legião Urbana",
    key: "C",
    capo: "Sem Capo",
    bpm: 124,
    media_url: "https://www.youtube.com/watch?v=iEbbGsHVGjU",
    body: `[Intro - tablatura alinhada]
e|---------------------------------|
B|---------------------------------|
G|---------------------------------|
D|-----------2-----------2---------|
A|-----3-----------3---------------|
E|-1-----------1-------------------|

[Base]
C   G   Am   F

[Primeira Parte]
C                 G
(verso — dicção firme)
Am                F
(resposta do verso)

[Refrão]
F        G        C
(refrão — sustente as notas longas)
F        G        Am
(variação final)

[Final]
F   G   C`,
  },
];
