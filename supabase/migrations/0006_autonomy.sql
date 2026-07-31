-- Autonomia da moto, em quilômetros.
--
-- UM número, e não tanque mais consumo: quem anda de moto sabe dizer "a minha
-- faz uns 300 com um tanque" com bem mais confiança do que sabe o consumo
-- exato. Pedir duas medidas para chegar a uma seria transferir ao usuário uma
-- conta que ele já fez na estrada.
--
-- Vive em `profiles`, e não em `motorcycles`, de propósito. A tabela de motos
-- existe desde a 0001 e nunca teve tela; construir cadastro com marca, modelo e
-- ano para chegar a um único número seria uma funcionalidade inteira no caminho
-- de uma conta simples. Quando houver uma segunda moto, a coluna migra.
--
-- NULO é estado legítimo e comum: significa "não informei", e nesse caso o
-- produto NÃO OPINA sobre combustível. Chutar uma autonomia média seria inventar
-- dado sobre o veículo de outra pessoa.
alter table profiles add column autonomy_km integer;

alter table profiles add constraint profiles_autonomy_km_range
  check (autonomy_km is null or (autonomy_km between 50 and 900));

comment on column profiles.autonomy_km is
  'Autonomia da moto em km, informada pelo usuario. Nulo = nao informado.';
