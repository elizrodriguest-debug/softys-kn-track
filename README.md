# Recebimento Interno e Externo

Crie uma aplicação web moderna, responsiva e completa de "Controle Operacional de Inbound (Recebimento Interno e Externo)" para acompanhamento logístico em parceria entre Softys e Kuehne+Nagel.

### 1. Visão Geral e Objetivo

A aplicação serve para gerenciar e registrar as descargas de veículos nos processos de recebimento:

- **Recebimento Interno:** Transferências entre fábricas/filiais (Divisões Tissue e Personal), monitorando metas por turno, falta de ASN (Advanced Shipping Notice), inconsistências em etiquetas iLPN e anomalias físicas em pallets (quebrados ou tombados).

- **Recebimento Externo:** Recebimento de cargas de fornecedores terceiros, controlando Nota Fiscal, divergências de quantidade física vs faturada, avarias em embalagens e conformidade com a etiqueta padrão Softys.

---

## 2. Autenticação e Perfis de Acesso

A autenticação é realizada através de seleção de usuário e digitação de um PIN de 4 dígitos.

### Perfis de Usuário

**1. OPERADOR**

- Registra e edita descargas no turno ativo.

- Preenche o Diário de Bordo do turno com justificativas de eventuais gargalos.

- Acessa o Portal de Treinamento.

**2. AUDITOR**

- Visualiza dashboards operacionais e relatórios consolidados mensais.

- Audita divergências e relatórios de conformidade.

**3. ADMINISTRADOR**

- Possui acesso total ao sistema.

- Gerencia usuários (cadastrar, editar, ativar/desativar, redefinir PIN).

- Exclui registros operacionais se necessário.

- Acessa os logs do Histórico de Auditoria.

---

## 3. Módulos e Funcionalidades Principais

### A. Acompanhamento (Dashboard Operacional)

- Seleção de Data e Turnos (T1: 06h–14h, T2: 14h–22h, T3: 22h–06h).

- Métricas de desempenho comparando descargas realizadas vs meta do turno (ex: Meta de 25 veículos para Interno, 5 para Externo).

- Cards e indicadores visuais com contagem de anomalias:

  - Falta de ASN / Divergências

  - iLPNs inválidas ou ausentes

  - Pallets quebrados e tombados

  - Divergências de quantidade e produtos avariados

- Dashboard com gráficos interativos de desempenho por turno, dia e mês.

- Indicadores comparativos entre Recebimento Interno e Externo.

- Gráficos de tendência, conformidade e evolução das ocorrências.

- **Diário de Bordo do Turno:** Campo para registro de justificativas operacionais (ex: queda de sistema WMS, falta de empilhadeiras, atraso fiscal).

### B. Recebimento Interno e Externo (Listagem e Formulário)

#### Formulário de Descarga

- Número de identificação da ASN ou Nota Fiscal.

- Divisão (Tissue ou Personal).

- Placa do veículo.

- Transportadora.

- Contagem total de volumes/pallets descarregados.

- Checkboxes e campos numéricos para registrar ocorrências específicas:

  - Quantidade de pallets quebrados.

  - Quantidade de pallets tombados.

  - iLPNs ausentes.

  - iLPNs inválidas.

  - Divergência física de caixas.

#### Listagem Interativa

- Tabela responsiva.

- Busca rápida.

- Filtros por data, turno, divisão e tipo de recebimento.

- Badges coloridos indicando ocorrências.

- Ações de edição e exclusão conforme permissões do perfil.

### C. Relatório Mensal Consolidado

- Tabela de resumo mensal das operações.

- Totalização de volumes recebidos.

- Número de descargas sem anomalias.

- Número de descargas com divergências.

- Taxa percentual de conformidade.

- Gráficos consolidados mensais.

- Recursos de exportação de relatórios (Excel e PDF).

### D. Portal de Treinamento & Playbook Operacional

Aba interativa dividida em **3 seções**:

#### 1. Guia Rápido de Uso

Tutorial passo a passo ilustrado para:

- acesso com PIN;

- registro de descargas;

- preenchimento do Diário de Bordo.

#### 2. Glossário de Ocorrências

Lista de busca interativa contendo termos técnicos como:

- ASN;

- iLPN;

- Pallet Tombado;

- Divergência Fiscal;

- Divergência Física;

- Pallet Quebrado;

- entre outros.

#### 3. Matriz de Perfis & Permissões

Explicação clara das responsabilidades de:

- Operador;

- Auditor;

- Administrador.

### E. Gestão de Usuários (Apenas Administrador)

- Cadastro de novos operadores.

- Redefinição de PIN de 4 dígitos.

- Ativação e desativação de contas.

### F. Histórico de Auditoria (Apenas Administrador)

Trilha completa de auditoria contendo:

- Data.

- Hora.

- Usuário.

- Perfil.

- Ação realizada.

- Tipo da operação (Criação, Alteração ou Exclusão).

---

## 4. Design e Identidade Visual

- Tema industrial/corporativo moderno utilizando Tailwind CSS.

- Fundo principal: `#f8fafc`.

- Containers brancos com sombras suaves.

- Bordas arredondadas.

- Interface limpa e intuitiva.

### Cores

- Azul corporativo: `#003369`

- Verde conformidade: `#08C792`

- Amarelo/Laranja para alertas.

- Vermelho para anomalias críticas.

### Tipografia

- **Inter** para textos e tabelas.

- **Space Grotesk** para títulos.

### Branding

- Exibir as marcas Softys e Kuehne+Nagel no cabeçalho.

### Responsividade

A aplicação deve funcionar perfeitamente em:

- Computadores.

- Tablets utilizados nas docas.

- Smartphones.

### Requisitos Gerais

- Interface moderna.

- Dashboards com gráficos interativos.

- Alto desempenho.

- Navegação intuitiva.

- Componentes reutilizáveis.

- Estrutura preparada para integração futura com APIs e banco de dados.

- Permissões baseadas no perfil do usuário.

- Experiência de uso fluida e profissional.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://softys-kn-track.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/47b4d9ae-61c9-4bb6-8385-9f9d41ac7da8).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
