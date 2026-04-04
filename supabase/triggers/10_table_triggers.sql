begin;

drop trigger if exists trg_set_categories_updated_at on public.door_categories;
create trigger trg_set_categories_updated_at
before update on public.door_categories
for each row
execute function public.set_updated_at();

drop trigger if exists trg_set_products_updated_at on public.door_products;
create trigger trg_set_products_updated_at
before update on public.door_products
for each row
execute function public.set_updated_at();

drop trigger if exists trg_set_product_images_updated_at on public.door_product_images;
create trigger trg_set_product_images_updated_at
before update on public.door_product_images
for each row
execute function public.set_updated_at();

drop trigger if exists trg_prepare_order_before_write on public.orders;
create trigger trg_prepare_order_before_write
before insert or update on public.orders
for each row
execute function public.prepare_order_before_write();

drop trigger if exists trg_05_merge_duplicate_order_items on public.order_items;
create trigger trg_05_merge_duplicate_order_items
before insert on public.order_items
for each row
execute function public.merge_duplicate_order_items();

drop trigger if exists trg_10_apply_order_item_defaults on public.order_items;
create trigger trg_10_apply_order_item_defaults
before insert or update on public.order_items
for each row
execute function public.apply_order_item_defaults();

drop trigger if exists trg_log_order_status_event on public.orders;
create trigger trg_log_order_status_event
after insert or update on public.orders
for each row
execute function public.log_order_status_event();

commit;
