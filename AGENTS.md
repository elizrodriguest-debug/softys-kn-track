<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- The shared database is the single source of truth for loads, logbook and settings; the browser only stores the UI shift preference. Why: multiple users must see the same data.
- Login is username + PIN mapped to an internal email/derived password; users are created only by admins via server functions (public sign-up disabled). Why: no real emails, admin-controlled access.
- Roles live in user_roles (ADMINISTRADOR/OPERACIONAL/VISUALIZADOR) and are enforced by RLS plus a DB trigger (status changes admin-only, optimistic version check). Why: permissions must hold even if the UI is bypassed.
