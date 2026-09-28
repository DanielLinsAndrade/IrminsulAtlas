import metadata from '../../package.json';

export const PRODUCT = {
  name: 'Irminsul Atlas',
  tagline: 'Registre, planeje e acompanhe sua jornada.',
  version: metadata.version,
  repository: 'https://github.com/DanielLinsAndrade/IrminsulAtlas',
  logo: '/brand/irminsul_logo.png',
  icon: '/brand/irminsul-icon-source.png',
} as const;
