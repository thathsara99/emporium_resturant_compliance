// src/pages/ResetPassword.jsx
import React, { useEffect, useState } from 'react';
import {
  Form,
  Input,
  Button,
  Typography,
  message,
  Card,
} from 'antd';
import { MailOutlined, LockOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const COMPANY_LOGO_URL = 'https://vintageteaemporium.co.uk/wp-content/uploads/2016/11/vintage-tea-emporium-logo-black.png';

const ResetPasswordPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  const onFinish = async (values) => {
    setLoading(true);

    try {
      // First, get the reset token
      const tokenResponse = await fetch(`${process.env.REACT_APP_API_BASE}/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: values.email,
        }),
      });

      const tokenData = await tokenResponse.json();
      console.log('Forgot password response:', tokenData);

      if (!tokenResponse.ok) {
        message.error(tokenData.message || 'Failed to process reset request');
        setLoading(false);
        return;
      }

      // Then immediately reset the password with the token
              const resetResponse = await fetch(`${process.env.REACT_APP_API_BASE}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: values.email,
          newPassword: values.newPassword,
          confirmPassword: values.confirmPassword,
          resetToken: tokenData.resetToken,
        }),
      });

      const resetData = await resetResponse.json();
      console.log('Reset password response:', resetData);

      if (resetResponse.ok) {
        message.success('Password reset successfully!');
        navigate('/login');
      } else {
        message.error(resetData.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      message.error('Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes forgotFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes forgotBgFloat {
          from { background-position: center top; }
          to { background-position: center bottom; }
        }
        @keyframes floatBlob {
          0% { transform: translate(0, 0); }
          50% { transform: translate(16px, -12px); }
          100% { transform: translate(0, 0); }
        }
      `}</style>
      <div
        style={{
          position: 'relative',
          height: '100vh',
          width: '100%',
          backgroundImage: `
            radial-gradient(circle at 15% 20%, rgba(201, 161, 91, 0.28), transparent 40%),
            radial-gradient(circle at 85% 80%, rgba(120, 72, 45, 0.3), transparent 45%),
            linear-gradient(135deg, #2f241d 0%, #3a2d24 35%, #4b3628 100%)
          `,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          boxSizing: 'border-box',
          overflow: 'hidden',
          animation: 'forgotBgFloat 16s ease-in-out infinite alternate'
        }}
      >
      <div
        style={{
          position: 'absolute',
          top: '-120px',
          right: '-90px',
          width: 360,
          height: 360,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(224, 184, 116, 0.45), rgba(224, 184, 116, 0))',
          filter: 'blur(4px)',
          animation: 'floatBlob 9s ease-in-out infinite',
          pointerEvents: 'none'
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-150px',
          left: '-120px',
          width: 420,
          height: 420,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(121, 76, 52, 0.5), rgba(121, 76, 52, 0))',
          filter: 'blur(6px)',
          animation: 'floatBlob 11s ease-in-out infinite',
          pointerEvents: 'none'
        }}
      />
      <Card
        style={{
          width: '100%',
          maxWidth: 520,
          borderRadius: 18,
          boxShadow: '0 24px 55px rgba(0, 0, 0, 0.35)',
          border: '1px solid rgba(214, 176, 117, 0.35)',
          background: 'linear-gradient(145deg, rgba(255, 250, 244, 0.95), rgba(255, 244, 232, 0.9))',
          backdropFilter: 'blur(10px)',
          animation: 'forgotFadeIn 0.6s ease-out',
          transition: 'transform 0.25s ease, box-shadow 0.25s ease'
        }}
        bodyStyle={{ padding: '34px 34px 28px' }}
        hoverable
      >
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <img
                src={COMPANY_LOGO_URL}
                alt="Logo"
                style={{ marginBottom: 10, width: '220px', maxWidth: '100%' }}
              />
              <Title level={3} style={{ marginBottom: 8, color: '#4a2e1f' }}>Reset Password</Title>
              <Text style={{ color: '#7a5a45' }}>
                Enter your email and new password to reset your account.
              </Text>
            </div>

            <Form
              form={form}
              name="resetPassword"
              onFinish={onFinish}
              layout="vertical"
            >
              <Form.Item
                name="email"
                label="Email Address"
                rules={[
                  { required: true, message: 'Please enter your email!' },
                  { type: 'email', message: 'Please enter a valid email!' },
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder="you@example.com"
                  size="large"
                  style={{ borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.75)' }}
                />
              </Form.Item>

              <Form.Item
                name="newPassword"
                label="New Password"
                rules={[
                  { required: true, message: 'Please enter your new password!' },
                  { min: 6, message: 'Password must be at least 6 characters long!' },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="New Password"
                  size="large"
                  style={{ borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.75)' }}
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="Confirm Password"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: 'Please confirm your password!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Passwords do not match!'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Confirm Password"
                  size="large"
                  style={{ borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.75)' }}
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  size="large"
                  loading={loading}
                  style={{
                    borderRadius: 10,
                    border: 'none',
                    height: 44,
                    background: 'linear-gradient(90deg, #b98749 0%, #8f5a33 100%)',
                    boxShadow: '0 10px 22px rgba(143, 90, 51, 0.35)',
                    fontWeight: 600
                  }}
                >
                  Reset Password
                </Button>
              </Form.Item>
            </Form>

                        <Button
              type="link"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/login')}
              style={{ padding: 0 }}
            >
              Back to Login
            </Button>
          </Card>
        </div>
    </>
  );
};

export default ResetPasswordPage;
