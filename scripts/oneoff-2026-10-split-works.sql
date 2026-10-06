-- Разовый перенос (2026-10): главная разделена на вкладки «Бровист с 0» и «Натуральный перманент».
-- Фото учениц-бровистов (brow-zero-*) переезжают из общей «Работы учениц» во вкладку «Бровист с 0»;
-- остальное остаётся у перманента. Повторный запуск ничего не делает (browWorks уже заполнен).
UPDATE "LandingContent"
SET "browWorks" = COALESCE((SELECT jsonb_agg(e) FROM jsonb_array_elements(works) e
                            WHERE e->>'src' LIKE '/landing/works/brow-zero-%'), '[]'::jsonb),
    works       = COALESCE((SELECT jsonb_agg(e) FROM jsonb_array_elements(works) e
                            WHERE e->>'src' NOT LIKE '/landing/works/brow-zero-%'), '[]'::jsonb),
    "updatedAt" = now()
WHERE id = 'default' AND "browWorks" = '[]'::jsonb
RETURNING jsonb_array_length("browWorks") AS brow_works, jsonb_array_length(works) AS permanent_works;
