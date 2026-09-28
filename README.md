# Irminsul Atlas

Registre, planeje e acompanhe sua jornada.

Aplicativo desktop local-first criado por fãs para gerenciamento e planejamento relacionados a Genshin Impact. Dados locais em SQLite, múltiplos perfis e backups manuais.

## Desenvolvimento

No Windows, instale Node.js 22.16 ou superior, Rust estável, Microsoft C++ Build Tools com Windows SDK e WebView2 Runtime.

```powershell
npm.cmd ci
npm.cmd run tauri dev
```

Validações e compilação a partir do código-fonte:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
cargo check --locked --manifest-path src-tauri/Cargo.toml
cargo test --locked --manifest-path src-tauri/Cargo.toml
npm.cmd run tauri -- build --ci --no-bundle
```

O executável compilado fica em `src-tauri/target/release/`. Para gerar instaladores apenas localmente, omita `--no-bundle`. Esta distribuição não inclui instaladores, dados pessoais nem a suíte frontend interna; os testes unitários Rust acompanham os módulos correspondentes.

## Aviso

Projeto comunitário não oficial, sem afiliação, patrocínio ou endosso da HoYoverse/COGNOSPHERE. Conteúdos de Genshin Impact pertencem aos respectivos titulares. Compilar o projeto não concede direitos adicionais sobre assets de terceiros.

## Legal

- [Copyright](legal/COPYRIGHT.md)
- [Aviso legal](legal/DISCLAIMER.md)
- [Privacidade](legal/PRIVACY.md)
- [Licenças e avisos de terceiros](legal/THIRD_PARTY_NOTICES.md)

Nenhuma licença open-source geral foi definida para o código próprio. Consulte os avisos antes de redistribuir.
