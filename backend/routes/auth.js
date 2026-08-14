const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Modelimizi içeri alıyoruz

const router = express.Router();

// ==========================================
// 1. KAYIT OL (REGISTER)
// ==========================================
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // Kullanıcı zaten var mı kontrol et
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Bu e-posta adresi zaten kullanımda." });
    }

    // Şifreyi Hash'le (Güvenlik için şifrele)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Yeni kullanıcıyı oluştur
    const newUser = new User({
      fullName,
      email,
      password: hashedPassword
    });

    await newUser.save();

    // DİKKAT: Senin isteğin üzerine burada Token (Giriş Anahtarı) DÖNMÜYORUZ.
    // Sadece başarı mesajı dönüyoruz. Böylece React tarafı otomatik giriş yapmayacak.
    res.status(201).json({ message: "Kayıt işlemi başarılı! Lütfen giriş yapınız." });

  } catch (error) {
    console.error("Kayıt Hatası:", error);
    res.status(500).json({ message: "Sunucu tarafında bir hata oluştu!" });
  }
});

// ==========================================
// 2. GİRİŞ YAP (LOGIN)
// ==========================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Kullanıcıyı veritabanında bul
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Böyle bir kullanıcı bulunamadı." });
    }

    // Şifreler eşleşiyor mu kontrol et
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Hatalı şifre girdiniz." });
    }

    // Şifre doğruysa Token (JWT) oluştur
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' } // 1 gün boyunca giriş açık kalır
    );

    // Token ve kullanıcı bilgilerini Frontend'e gönder
    res.status(200).json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Giriş Hatası:", error);
    res.status(500).json({ message: "Sunucu tarafında bir hata oluştu!" });
  }
});

module.exports = router;