# Irminsul Atlas — Privacidade no Desktop

Atualização: 28 de setembro de 2026.

## Privacidade e armazenamento local

Esta política descreve o Irminsul Atlas Desktop. Não há conta online obrigatória do aplicativo, servidor próprio de sincronização nem sincronização automática entre dispositivos. Perfis, tiros, recursos, personagens, builds, conquistas e configurações são armazenados em SQLite local na sua máquina.

O identificador com.wishlog.app e o arquivo wishlog.db foram mantidos por compatibilidade. O diretório é resolvido pelas APIs AppConfig do Tauri; não é a pasta do executável. O modo navegador deste repositório é apenas uma prévia de desenvolvimento com banco em memória, não uma versão Web com persistência garantida.

Nesta versão, não há analytics, publicidade ou envio automático de relatórios de uso implementados. Os dados locais não são enviados a um servidor próprio do Irminsul Atlas.

## Consultas externas e cache

A consulta pública por UID é opcional e envia o UID informado ao Enka.Network. O aplicativo não solicita nem armazena senha ou token da conta HoYoverse. Nome, biografia e outros dados públicos retornados ficam em cache local; quando a consulta falha, um cache anterior pode ser exibido como desatualizado.

Os assets priorizam arquivos incluídos no aplicativo e cache local. Quando um asset não está disponível localmente, o provider pode acessar a origem cadastrada no catálogo ou no cache, incluindo servidores de imagens da HoYoLAB/HoYoverse e espelhos comunitários. Assim, local-first não significa ausência absoluta de conexões externas.

Uma conexão externa revela ao destino dados de rede, como endereço IP e informações técnicas da requisição. Cada serviço possui suas próprias políticas; o Irminsul Atlas não opera esses serviços. Abrir um link externo também acessa o site escolhido.

## Seus dados

Em Configurações → Perfis de Conta → Backup & Restauração, exporte backups manuais e restaure perfis com prévia e estratégia de conflito. Tiros e conquistas também possuem exportação própria. JSONs de backup não são criptografados: podem conter UID, nomes, notas e progresso; compartilhe-os somente se desejar.

A biblioteca de artes é compartilhada localmente e tem backup separado na tela Artes. Ela não faz parte do backup de perfis. Preferências globais e cache de serviços externos também não integram esse formato de backup.

A exclusão de perfil exige confirmação na área de perfis. Ela não remove cópias de backup já exportadas nem a biblioteca de artes compartilhada; dados públicos em cache por UID podem permanecer localmente. A limpeza de cache de imagens não apaga o progresso. Remover a pasta de dados pode causar perda: mantenha backups antes de reinstalar, mover ou limpar arquivos.

## Serviços e fontes

- [Enka.Network](https://enka.network/): Consulta opcional de perfil público por UID; também fonte de arquivos de imagens incorporados localmente.
- [HoYoWiki / HoYoLAB](https://wiki.hoyolab.com/pc/genshin/home): Referência e origens registradas no catálogo/provider de assets. Não é um serviço de sincronização de progresso do aplicativo.
- [genshin-db](https://github.com/theBowja/genshin-db): Fonte comunitária de snapshots de dados, incluindo conquistas e metadados de itens. Aviso MIT de theBowja preservado separadamente dos direitos sobre conteúdo do jogo.
- [Seelie.me](https://seelie.me/): Referência funcional e compatibilidade de importação de arquivos de conquistas. A importação lê um arquivo local; não envia o histórico ao Seelie.
- [Genshin Center](https://genshin-center.com/pt/planner): Referência funcional de planejamento de evolução; sem integração de conta ou sincronização.
- [Genshin Impact Wiki / Fandom](https://genshin-impact.fandom.com/wiki/Genshin_Impact_Wiki): Referência de identificação de splash arts documentada no repositório. Não há sincronização de conta.
- [Genshin Impact Resources](https://genshinimpactresources.tumblr.com/): Espelho comunitário utilizado para arquivos locais de splash de Mavuika e Citlali; a hospedagem não transfere os direitos sobre as imagens.
- [Zerochan](https://www.zerochan.net/4522793): Origem documentada da imagem local de Skirk, atribuída à HoYoverse. Não implica licença ou parceria com o aplicativo.

Não há parceria implícita. Consulte as políticas de cada destino antes de enviar informações ou abrir seus links.
