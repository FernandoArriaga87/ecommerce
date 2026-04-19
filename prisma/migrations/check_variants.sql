SELECT v."id", v."size", v."stock", v."color", p."name" as "productName"
FROM "Variant" v
JOIN "Product" p ON v."productId" = p."id"
WHERE p."name" LIKE '%Madrid%'
ORDER BY p."name", v."size";
