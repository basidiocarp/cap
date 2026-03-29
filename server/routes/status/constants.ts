export const LSP_SERVERS: { bin: string; language: string; name: string }[] = [
  { bin: 'typescript-language-server', language: 'TypeScript/JavaScript', name: 'typescript-language-server' },
  { bin: 'rust-analyzer', language: 'Rust', name: 'rust-analyzer' },
  { bin: 'pyright-langserver', language: 'Python', name: 'Pyright' },
  { bin: 'pylsp', language: 'Python', name: 'python-lsp-server' },
  { bin: 'gopls', language: 'Go', name: 'gopls' },
  { bin: 'clangd', language: 'C/C++', name: 'clangd' },
  { bin: 'lua-language-server', language: 'Lua', name: 'lua-language-server' },
  { bin: 'ruby-lsp', language: 'Ruby', name: 'ruby-lsp' },
  { bin: 'solargraph', language: 'Ruby', name: 'Solargraph' },
  { bin: 'zls', language: 'Zig', name: 'zls' },
  { bin: 'jdtls', language: 'Java', name: 'jdtls' },
  { bin: 'kotlin-language-server', language: 'Kotlin', name: 'kotlin-language-server' },
  { bin: 'elixir-ls', language: 'Elixir', name: 'elixir-ls' },
  { bin: 'sourcekit-lsp', language: 'Swift', name: 'sourcekit-lsp' },
]

export const RECOMMENDED_HOOK_EVENTS = ['SessionStart', 'PostToolUse', 'PreCompact', 'SessionEnd'] as const
