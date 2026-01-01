import { Product } from '../models/Product.js';

// @desc    Lấy tất cả sản phẩm
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
  try {
    // Tạo đối tượng query rỗng
    const query = {};

    // Nếu có tham số 'category' trên URL và không phải 'Tất cả', thêm vào query
    if (req.query.category && req.query.category !== 'Tất cả') {
      query.category = req.query.category;
    }
    // Nếu có tham số 'keyword' trên URL, thêm vào query để tìm kiếm theo tên (không phân biệt hoa thường)
    if (req.query.keyword) {
      query.name = { $regex: req.query.keyword, $options: 'i' };
    }

    const products = await Product.find(query);
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// @desc    Lấy sản phẩm theo ID
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// @desc    Tạo sản phẩm mới
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res) => {
  try {
    const { name, provider, category, price, description, imageUrl, insuredObject, benefits, annualInsurableAmount, insuranceTerm } = req.body;
    const product = new Product({
      name,
      provider,
      category,
      price,
      description,
      imageUrl,
      insuredObject,
      benefits,
      annualInsurableAmount,
      insuranceTerm,
    });
    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// @desc    Cập nhật sản phẩm
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res) => {
  try {
    const { name, provider, category, price, description, imageUrl, insuredObject, benefits, annualInsurableAmount, insuranceTerm } = req.body;
    const product = await Product.findById(req.params.id);

    if (product) {
      product.name = name;
      product.provider = provider;
      product.category = category;
      product.price = price;
      product.description = description;
      product.imageUrl = imageUrl;
      product.insuredObject = insuredObject;
      product.benefits = benefits;
      product.annualInsurableAmount = annualInsurableAmount;
      product.insuranceTerm = insuranceTerm;

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// @desc    Xóa sản phẩm
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      await product.deleteOne();
      res.json({ message: 'Sản phẩm đã được xóa' });
    } else {
      res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// @desc    Lấy tất cả các danh mục sản phẩm duy nhất
// @route   GET /api/products/categories
// @access  Public
export const getProductCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};