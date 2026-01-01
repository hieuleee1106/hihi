import { InsuranceApplication } from '../models/InsuranceApplication.js';
import { Notification } from '../models/Notification.js';

// @desc    Tạo hồ sơ đăng ký mới (cho User)
// @route   POST /api/applications
// @access  Private
export const createApplication = async (req, res) => {
  try {
    const { productId, ...applicationData } = req.body;

    const documents = req.files.map(file => ({
      name: file.originalname,
      // Tạo URL đầy đủ để frontend có thể truy cập
      url: `${req.protocol}://${req.get("host")}/${file.path.replace(/\\/g, "/")}`
    }));

    const application = new InsuranceApplication({
      applicant: req.user._id,
      product: productId,
      applicationData,
      documents,
    });

    await application.save();
    res.status(201).json({ message: 'Nộp hồ sơ thành công! Chúng tôi sẽ sớm xem xét và phản hồi cho bạn.' });
  } catch (error) {
    console.error("Lỗi tạo hồ sơ:", error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// @desc    Lấy tất cả hồ sơ đăng ký (cho Admin)
// @route   GET /api/applications
// @access  Private/Admin
export const getApplications = async (req, res) => {
  try {
    const applications = await InsuranceApplication.find({})
      .populate('applicant', 'name email')
      .populate('product', 'name')
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// @desc    Lấy hồ sơ theo ID (cho Admin)
// @route   GET /api/applications/:id
// @access  Private/Admin
export const getApplicationById = async (req, res) => {
  try {
    const application = await InsuranceApplication.findById(req.params.id)
      .populate('applicant', 'name email phone')
      .populate('product');

    if (application) {
      res.json(application);
    } else {
      res.status(404).json({ message: 'Không tìm thấy hồ sơ' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// @desc    Cập nhật trạng thái hồ sơ (cho Admin)
// @route   PUT /api/applications/:id
// @access  Private/Admin
export const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body; // Lấy trạng thái mới từ body
    const application = await InsuranceApplication.findById(req.params.id).populate('product', 'name');

    if (!application) {
      return res.status(404).json({ message: 'Không tìm thấy hồ sơ' });
    }

    // Chỉ tạo thông báo nếu trạng thái thay đổi
    if (application.status !== status) {
      await Notification.create({
        user: application.applicant,
        message: `Hồ sơ "${application.product.name}" của bạn đã được cập nhật trạng thái thành "${status}".`,
        link: '/my-products'
      });
    }

    application.status = status;
    await application.save();

    // Populate lại thông tin applicant để trả về cho frontend
    const updatedApplication = await InsuranceApplication.findById(application._id)
      .populate('applicant', 'name email phone')
      .populate('product');

    res.json({ message: 'Cập nhật trạng thái thành công', application: updatedApplication });

  } catch (error) {
    console.error("Lỗi cập nhật trạng thái:", error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// @desc    Lấy tất cả hồ sơ của người dùng hiện tại
// @route   GET /api/applications/my
// @access  Private
export const getMyApplications = async (req, res) => {
  try {
    // Lọc thêm điều kiện isHidden không phải là true
    const applications = await InsuranceApplication.find({ 
      applicant: req.user._id,
      isHidden: { $ne: true } 
    })
      .populate('product', 'name category')
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// @desc    Ẩn hồ sơ (User tự ẩn)
// @route   PUT /api/applications/:id/hide
// @access  Private
export const hideApplication = async (req, res) => {
  try {
    const application = await InsuranceApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ message: 'Không tìm thấy hồ sơ.' });
    }

    // Chỉ cho phép chủ hồ sơ ẩn
    if (application.applicant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bạn không có quyền thực hiện hành động này.' });
    }

    application.isHidden = true;
    await application.save();
    res.json({ message: 'Đã ẩn hồ sơ thành công.' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// @desc    Admin xóa hồ sơ vĩnh viễn
// @route   DELETE /api/applications/:id
// @access  Private/Admin
export const deleteApplicationByAdmin = async (req, res) => {
  try {
    const application = await InsuranceApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ message: 'Không tìm thấy hồ sơ.' });
    }

    await application.deleteOne();
    res.json({ message: 'Đã xóa vĩnh viễn hồ sơ.' });
  } catch (error) {
    console.error("Lỗi xóa hồ sơ (Admin):", error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};