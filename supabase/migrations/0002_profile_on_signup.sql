-- Perfil criado no primeiro login.
--
-- Trigger em vez de responsabilidade da aplicação: um usuário autenticado sem
-- linha em `profiles` é um estado inconsistente que nenhuma tela sabe tratar, e
-- deixar a criação a cargo do app significa que qualquer caminho de entrada novo
-- pode esquecer de criá-la.
--
-- `home_latitude` e `home_longitude` nascem nulos de propósito: a origem é
-- escolhida pelo usuário clicando no mapa, e inventar uma origem padrão faria o
-- produto mentir sobre distâncias na primeira sessão.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
