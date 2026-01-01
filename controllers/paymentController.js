import axios from 'axios';
import crypto from 'crypto';
import { Contract } from '../models/Contract.js'; // Đảm bảo đường dẫn đúng tới model Contract

export const createZaloPayTest = async (req, res) => {
  const { amount, contractNumber } = req.body;
  const config = {
    app_id: process.env.ZALOPAY_APP_ID || "2553",
    key1: process.env.ZALOPAY_KEY1 || "PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL",
    key2: process.env.ZALOPAY_KEY2 || "kLtgPl8HHhfvMuDHPwKfgfsY4Ydm9eIz",
    endpoint: process.env.ZALOPAY_ENDPOINT || "https://sb-openapi.zalopay.vn/v2/create"
  };

  const embed_data = {
    contractNumber: contractNumber, // Gửi kèm mã hợp đồng để dùng trong callback
  };
  const items = [{}];
  const transID = Math.floor(Math.random() * 1000000);
  
  const date = new Date();
  const yy = date.getFullYear().toString().slice(2);
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const dd = date.getDate().toString().padStart(2, '0');
  
  const order = {
    app_id: config.app_id,
    app_user: "test_demo",
    app_time: Date.now(), // milliseconds
    amount: amount || 50000,
    app_trans_id: `${yy}${mm}${dd}_${transID}`,
    embed_data: JSON.stringify(embed_data),
    item: JSON.stringify(items),
    description: contractNumber ? `Thanh toan HD #${contractNumber}` : `ZaloPay Test #${transID}`,
  };

  // Lưu app_trans_id vào hợp đồng để sau này kiểm tra trạng thái
  if (contractNumber) {
    await Contract.findOneAndUpdate(
      { contractNumber: contractNumber },
      { 'paymentDetails.zaloTransId': order.app_trans_id }
    );
  }

  // app_id|app_trans_id|app_user|amount|app_time|embed_data|item
  const data = config.app_id + "|" + order.app_trans_id + "|" + order.app_user + "|" + order.amount + "|" + order.app_time + "|" + order.embed_data + "|" + order.item;
  order.mac = crypto.createHmac('sha256', config.key1).update(data).digest('hex');

  try {
    const result = await axios.post(config.endpoint, null, { params: order });
    return res.status(200).json(result.data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const callback = async (req, res) => {
  let result = {};
  try {
    const { data: dataStr, mac: reqMac } = req.body;
    console.log("ZaloPay Callback received:", dataStr);

    const config = {
      key2: process.env.ZALOPAY_KEY2 || "kLtgPl8HHhfvMuDHPwKfgfsY4Ydm9eIz"
    };

    const mac = crypto.createHmac('sha256', config.key2).update(dataStr).digest('hex');

    // Kiểm tra tính hợp lệ của callback (xác thực từ ZaloPay)
    if (reqMac !== mac) {
      result.return_code = -1;
      result.return_message = "mac not equal";
    } else {
      // Thanh toán thành công
      const dataJson = JSON.parse(dataStr);
      // Lấy contractNumber từ embed_data
      const embedData = JSON.parse(dataJson.embed_data);
      const contractNumber = embedData.contractNumber;

      if (contractNumber) {
        // Cập nhật trạng thái hợp đồng
        await Contract.findOneAndUpdate(
          { contractNumber: contractNumber },
          { status: 'Hiệu lực' }
        );
      }

      result.return_code = 1;
      result.return_message = "success";
    }
  } catch (ex) {
    result.return_code = 0;
    result.return_message = ex.message;
  }

  res.json(result);
};

export const checkZaloPayStatus = async (req, res) => {
  const { contractNumber } = req.body;
  try {
    const contract = await Contract.findOne({ contractNumber });
    
    if (!contract || !contract.paymentDetails || !contract.paymentDetails.zaloTransId) {
      return res.status(400).json({ return_code: 0, return_message: "Không tìm thấy mã giao dịch ZaloPay." });
    }

    const config = {
      app_id: process.env.ZALOPAY_APP_ID || "2553",
      key1: process.env.ZALOPAY_KEY1 || "PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL",
      endpoint: "https://sb-openapi.zalopay.vn/v2/query"
    };

    const params = {
      app_id: config.app_id,
      app_trans_id: contract.paymentDetails.zaloTransId,
    };

    const data = config.app_id + "|" + params.app_trans_id + "|" + config.key1;
    params.mac = crypto.createHmac('sha256', config.key1).update(data).digest('hex');

    const result = await axios.post(config.endpoint, null, { params });
    
    // return_code = 1 nghĩa là thanh toán thành công
    if (result.data.return_code === 1) {
      await Contract.findOneAndUpdate({ contractNumber }, { status: 'Hiệu lực' });
    }

    return res.json(result.data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};