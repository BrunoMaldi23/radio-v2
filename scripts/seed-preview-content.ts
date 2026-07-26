import { ContentStatus, PrismaClient, ProgramStatus } from '@prisma/client';

const prisma = new PrismaClient();

const articleBody = (title: string, category: string) => `
  <p><strong>${title}</strong> es un contenido de prueba para validar la maqueta publica de Radio Hit 90 y 2000.</p>
  <p>Sirve para revisar jerarquia visual, espacios, cards, imagenes, titulares y llamados a la accion dentro de la seccion ${category}.</p>
`;

const publishedAt = (daysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
};

async function upsertArticle(input: {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  coverUrl: string;
  daysAgo: number;
  likes?: number;
  attendees?: number;
}) {
  await prisma.article.upsert({
    where: { slug: input.slug },
    update: {
      title: input.title,
      excerpt: input.excerpt,
      body: articleBody(input.title, input.category),
      category: input.category,
      coverUrl: input.coverUrl,
      likes: input.likes ?? 0,
      attendees: input.attendees ?? 0,
      status: ContentStatus.PUBLISHED,
      publishedAt: publishedAt(input.daysAgo),
    },
    create: {
      slug: input.slug,
      title: input.title,
      excerpt: input.excerpt,
      body: articleBody(input.title, input.category),
      category: input.category,
      coverUrl: input.coverUrl,
      likes: input.likes ?? 0,
      attendees: input.attendees ?? 0,
      status: ContentStatus.PUBLISHED,
      publishedAt: publishedAt(input.daysAgo),
    },
  });
}

async function main() {
  const cover = '/header-radio.jpeg';
  const logo = '/logo-home.jpeg';
  const mark = '/logo-radio.png';

  const articles = [
    {
      slug: 'demo-noticia-cabina-en-vivo',
      title: 'La cabina prepara una jornada especial en vivo',
      excerpt: 'Una pauta local con musica, saludos y novedades para acompanar la tarde.',
      category: 'Noticias',
      coverUrl: cover,
      daysAgo: 1,
      likes: 18,
    },
    {
      slug: 'demo-noticia-ranking-audiencia',
      title: 'El ranking suma nuevos votos de la audiencia',
      excerpt: 'La comunidad ya mueve las canciones favoritas de la semana.',
      category: 'Noticias',
      coverUrl: logo,
      daysAgo: 2,
      likes: 12,
    },
    {
      slug: 'demo-noticia-tv-radio-hit',
      title: 'Radio Hit TV activa su senal de prueba',
      excerpt: 'El espacio visual queda listo para transmisiones, entrevistas y eventos.',
      category: 'Noticias',
      coverUrl: mark,
      daysAgo: 3,
      likes: 9,
    },
    {
      slug: 'demo-exitos-ritmo-90',
      title: 'Tres canciones que encendieron los 90',
      excerpt: 'Un recorrido breve por esos himnos que siguen sonando grandes.',
      category: 'Exitos 90,2000',
      coverUrl: logo,
      daysAgo: 1,
      likes: 32,
    },
    {
      slug: 'demo-exitos-pop-2000',
      title: 'El pop de los 2000 vuelve a sonar fuerte',
      excerpt: 'Melodias, coros y energia para recordar una decada brillante.',
      category: 'Exitos 90,2000',
      coverUrl: cover,
      daysAgo: 2,
      likes: 27,
    },
    {
      slug: 'demo-exitos-lentos-radio-hit',
      title: 'Baladas para cantar de memoria',
      excerpt: 'Una seleccion de canciones lentas que marcaron historias.',
      category: 'Exitos 90,2000',
      coverUrl: mark,
      daysAgo: 4,
      likes: 21,
    },
    {
      slug: 'demo-evento-noche-retro',
      title: 'Noche Retro Radio Hit',
      excerpt: 'Encuentro musical con clasicos, recuerdos y participacion de la comunidad.',
      category: 'Eventos',
      coverUrl: cover,
      daysAgo: 1,
      likes: 44,
      attendees: 86,
    },
    {
      slug: 'demo-evento-cabina-abierta',
      title: 'Cabina abierta con la audiencia',
      excerpt: 'Una instancia para enviar saludos, pedir canciones y conocer la radio por dentro.',
      category: 'Eventos',
      coverUrl: logo,
      daysAgo: 3,
      likes: 29,
      attendees: 52,
    },
    {
      slug: 'demo-evento-ranking-live',
      title: 'Especial Ranking Live',
      excerpt: 'Programa especial para votar, comentar y elegir los temas de la semana.',
      category: 'Eventos',
      coverUrl: mark,
      daysAgo: 5,
      likes: 36,
      attendees: 64,
    },
  ];

  await Promise.all(articles.map(upsertArticle));

  const programs = [
    {
      slug: 'demo-programa-despierta-hit',
      name: 'Despierta Hit',
      host: 'Equipo Radio Hit',
      description: 'Manana con energia, titulares rapidos, efemerides musicales y canciones para empezar arriba.',
      schedule: 'Lunes a viernes - 08:00 a 10:00',
      imageUrl: logo,
    },
    {
      slug: 'demo-programa-retro-drive',
      name: 'Retro Drive',
      host: 'Cabina 90 y 2000',
      description: 'Bloque de retorno a casa con pop, dance, rock latino y pedidos de la audiencia.',
      schedule: 'Lunes a viernes - 18:00 a 20:00',
      imageUrl: cover,
    },
    {
      slug: 'demo-programa-hit-nocturno',
      name: 'Hit Nocturno',
      host: 'Radio Hit',
      description: 'Baladas, recuerdos y relatos breves para cerrar el dia con clasicos de alto impacto.',
      schedule: 'Sabados - 22:00 a 00:00',
      imageUrl: mark,
    },
  ];

  await Promise.all(
    programs.map((program) =>
      prisma.program.upsert({
        where: { slug: program.slug },
        update: { ...program, status: ProgramStatus.ACTIVE },
        create: { ...program, status: ProgramStatus.ACTIVE },
      })
    )
  );

  const ranking = [
    { title: 'Vuelve el Hit', artist: 'Demo 90', artworkUrl: logo, votes: 128 },
    { title: 'Cabina Encendida', artist: 'Demo 2000', artworkUrl: cover, votes: 96 },
    { title: 'Noche de Exitos', artist: 'Radio Hit Band', artworkUrl: mark, votes: 73 },
  ];

  await Promise.all(
    ranking.map((track) =>
      prisma.rankingTrack.upsert({
        where: { title_artist: { title: track.title, artist: track.artist } },
        update: { ...track, isActive: true },
        create: { ...track, isActive: true },
      })
    )
  );
}

main()
  .then(() => {
    console.log('Contenido demo cargado: 3 noticias, 3 exitos, 3 eventos, 3 programas y 3 canciones.');
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
