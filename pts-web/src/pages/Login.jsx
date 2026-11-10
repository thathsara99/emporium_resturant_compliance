import React, { useEffect, useState } from 'react';
import {
  Form,
  Input,
  Button,
  Typography,
  Checkbox,
  message,
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { setAuthToken } from '../utils/auth';

const { Title, Text, Link } = Typography;
const COMPANY_LOGO_URL = 'https://vintageteaemporium.co.uk/wp-content/uploads/2016/11/vintage-tea-emporium-logo-black.png';

const LoginPage = ({ onLoginSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  const onFinish = async (values) => {
  setLoading(true);

  // Debug: Log the environment variable
  console.log('API Base URL:', process.env.REACT_APP_API_BASE);
  console.log('All environment variables:', process.env);

  try {
    const response = await fetch(`${process.env.REACT_APP_API_BASE}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: values.username,
        password: values.password,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      // Save token & expiry time using utility function
      setAuthToken(data.token);

      message.success('Login successful!');
      if (onLoginSuccess) onLoginSuccess();
      navigate('/home');
    } else {
      message.error(data.message || 'Invalid username or password!');
    }
  } catch (error) {
    message.error('Login failed. Please try again.');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="vtm-login">
      <style>{`
        .vtm-login {
          min-height: 100dvh;
          display: grid;
          grid-template-columns: minmax(280px, 1.05fr) minmax(340px, 0.95fr);
          background: #f6f0e8;
          color: #3b2618;
        }
        .vtm-login-brand {
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          padding: 48px 56px;
          background:
            radial-gradient(circle at 18% 18%, rgba(224, 184, 116, 0.45), transparent 36%),
            radial-gradient(circle at 82% 78%, rgba(90, 48, 28, 0.45), transparent 42%),
            linear-gradient(160deg, #2c1d14 0%, #4a2e1f 48%, #6d452c 100%);
          color: #f8f1e7;
        }
        .vtm-login-brand::after {
          content: '';
          position: absolute;
          width: 280px;
          height: 280px;
          right: -80px;
          top: -70px;
          border-radius: 50%;
          border: 1px solid rgba(246, 231, 212, 0.18);
        }
        .vtm-login-brand-inner {
          position: relative;
          z-index: 1;
          max-width: 460px;
        }
        .vtm-login-logo-plate {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #fffaf4;
          border-radius: 18px;
          padding: 14px 18px;
          margin-bottom: 28px;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.18);
        }
        .vtm-login-logo-plate img {
          width: 210px;
          max-width: 100%;
          height: auto;
          display: block;
        }
        .vtm-login-kicker {
          margin: 0 0 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          font-size: 12px;
          color: #e6c98a;
        }
        .vtm-login-brand h1 {
          margin: 0 0 12px;
          font-size: clamp(36px, 4vw, 56px);
          line-height: 1.05;
          font-weight: 650;
          color: #fffaf4;
        }
        .vtm-login-brand p {
          margin: 0;
          max-width: 380px;
          font-size: 16px;
          line-height: 1.6;
          color: rgba(248, 241, 231, 0.82);
        }
        .vtm-login-panel {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 24px;
        }
        .vtm-login-card {
          width: 100%;
          max-width: 420px;
        }
        .vtm-login-mobile-logo {
          display: none;
        }
        .vtm-login-card h2 {
          margin: 0 0 6px;
          font-size: 30px;
          line-height: 1.2;
          color: #3b2618;
        }
        .vtm-login-card .vtm-login-lead {
          display: block;
          margin-bottom: 28px;
          color: #7a5a45;
          font-size: 15px;
        }
        .vtm-login .ant-form-item-label > label {
          color: #4a2e1f;
          font-weight: 600;
        }
        .vtm-login .ant-input-affix-wrapper {
          border-radius: 12px;
          border-color: #e4d3c2;
          background: #fffdfb;
          padding: 10px 12px;
        }
        .vtm-login .ant-input-affix-wrapper:hover,
        .vtm-login .ant-input-affix-wrapper-focused {
          border-color: #b98749;
          box-shadow: 0 0 0 3px rgba(185, 135, 73, 0.16);
        }
        .vtm-login-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 8px;
        }
        .vtm-login .ant-checkbox-checked .ant-checkbox-inner {
          background-color: #8f5a33;
          border-color: #8f5a33;
        }
        .vtm-login a.vtm-login-forgot,
        .vtm-login a.vtm-login-forgot:hover,
        .vtm-login a.vtm-login-forgot:focus {
          color: #8f5a33;
          font-weight: 600;
        }
        .vtm-login-submit {
          height: 48px !important;
          border: none !important;
          border-radius: 12px !important;
          font-weight: 650;
          background: linear-gradient(90deg, #c49255 0%, #8f5a33 100%) !important;
          box-shadow: 0 12px 24px rgba(143, 90, 51, 0.28);
        }
        .vtm-login-submit:hover {
          filter: brightness(1.05);
        }
        @media (max-width: 900px) {
          .vtm-login {
            grid-template-columns: 1fr;
          }
          .vtm-login-brand {
            display: none;
          }
          .vtm-login-panel {
            min-height: 100dvh;
            padding: 28px 20px 36px;
            align-items: flex-start;
          }
          .vtm-login-mobile-logo {
            display: flex;
            justify-content: center;
            margin-bottom: 22px;
          }
          .vtm-login-mobile-logo img {
            width: min(220px, 70vw);
            height: auto;
          }
          .vtm-login-card h2 {
            font-size: 26px;
          }
        }
        @media (max-width: 420px) {
          .vtm-login-row {
            flex-direction: column;
            align-items: flex-start;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .vtm-login-submit {
            transition: none;
          }
        }
      `}</style>
      <section className="vtm-login-brand" aria-hidden="false">
        <div className="vtm-login-brand-inner">
          <div className="vtm-login-logo-plate">
            <img src={COMPANY_LOGO_URL} alt="Vintage Tea Emporium" />
          </div>
          <p className="vtm-login-kicker">Restaurant workspace</p>
          <h1>Vintage Tea Manager</h1>
          <p>Staff, shifts, documents, and daily service, kept together in one place.</p>
        </div>
      </section>
      <main className="vtm-login-panel">
        <div className="vtm-login-card">
          <div className="vtm-login-mobile-logo">
            <img src={COMPANY_LOGO_URL} alt="Vintage Tea Emporium" />
          </div>
          <Title level={2}>Welcome back</Title>
          <Text className="vtm-login-lead">Sign in to Vintage Tea Manager.</Text>
          <Form
            form={form}
            name="login"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            layout="vertical"
          >
            <Form.Item
              name="username"
              label="Username or Email"
              rules={[{ required: true, message: 'Please input your username or email!' }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Enter your username or email"
                size="large"
                autoComplete="username"
              />
            </Form.Item>
            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Please input your password!' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Enter your password"
                size="large"
                autoComplete="current-password"
              />
            </Form.Item>
            <Form.Item>
              <div className="vtm-login-row">
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox>Remember me</Checkbox>
                </Form.Item>
                <Link className="vtm-login-forgot" style={{ color: '#8f5a33' }} onClick={() => navigate('/forgot-password')}>
                  Forgot password?
                </Link>
              </div>
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={loading}
                className="vtm-login-submit"
              >
                Log in
              </Button>
            </Form.Item>
          </Form>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
