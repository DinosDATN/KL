UPDATE courses SET 
  price = 0,
  original_price = 0,
  discount = 0,
  is_free = TRUE
WHERE id IN (1, 2, 3);

UPDATE courses SET 
  price = 299000,
  original_price = 599000,
  discount = 50,
  is_free = FALSE
WHERE id = 4;

UPDATE courses SET 
  price = 499000,
  original_price = 999000,
  discount = 50,
  is_free = FALSE
WHERE id = 5;

UPDATE courses SET 
  price = 799000,
  original_price = 1299000,
  discount = 38,
  is_free = FALSE
WHERE id = 6;

UPDATE courses SET 
  price = 199000,
  original_price = 399000,
  discount = 50,
  is_free = FALSE
WHERE id = 7;

UPDATE courses SET 
  price = 0,
  original_price = 0,
  discount = 0,
  is_free = TRUE
WHERE id >= 8;
