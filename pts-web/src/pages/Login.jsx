import React, { useEffect, useState } from 'react';
import {
  Form,
  Input,
  Button,
  Typography,
  Checkbox,
  Layout,
  Row,
  Col,
  message,
  Card,
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
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

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
    <>
      <style>{`
        @keyframes loginFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes loginBgZoom {
          from { background-position: center top; }
          to { background-position: center bottom; }
        }
        @keyframes floatBlob {
          0% { transform: translate(0, 0); }
          50% { transform: translate(16px, -12px); }
          100% { transform: translate(0, 0); }
        }
      `}</style>
      <Layout
        style={{
          height: '100vh',
          backgroundImage: `
            radial-gradient(circle at 15% 20%, rgba(201, 161, 91, 0.28), transparent 40%),
            radial-gradient(circle at 85% 80%, rgba(120, 72, 45, 0.3), transparent 45%),
            linear-gradient(135deg, #2f241d 0%, #3a2d24 35%, #4b3628 100%)
          `,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          animation: 'loginBgZoom 20s ease-in-out infinite alternate',
          overflow: 'hidden',
          padding: '24px',
          boxSizing: 'border-box'
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
      <Row
        style={{ height: '100%', width: '100%', margin: 0 }}
        justify="center"
        align="middle"
      >
        <Col
          xs={24}
          sm={24}
          md={20}
          lg={14}
          xl={11}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0
          }}
        >
          <Card
            style={{
              width: '100%',
              maxWidth: '520px',
              minHeight: 'auto',
              margin: 0,
              animation: 'loginFadeIn 0.6s ease-out',
              transition: 'transform 0.25s ease, box-shadow 0.25s ease',
              background: 'linear-gradient(145deg, rgba(255, 250, 244, 0.95), rgba(255, 244, 232, 0.9))',
              border: '1px solid rgba(214, 176, 117, 0.35)',
              boxShadow: '0 24px 55px rgba(0, 0, 0, 0.35)',
              backdropFilter: 'blur(10px)',
              borderRadius: 18
            }}
            bodyStyle={{ transition: 'transform 0.25s ease', padding: '34px 34px 28px' }}
            hoverable
          >
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <img
                src={COMPANY_LOGO_URL}
                alt="Logo"
                style={{ marginBottom: 10, width: '220px', maxWidth: '100%' }}
              />
              <Title level={3} style={{ marginBottom: 8, color: '#4a2e1f' }}>Vintage Tea Emporium</Title>
              <Text style={{ color: '#7a5a45' }}>Welcome back to your restaurant workspace.</Text>
            </div>
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
                  style={{ borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.75)' }}
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
                  style={{ borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.75)' }}
                />
              </Form.Item>
              <Form.Item>
                <Row justify="space-between" align="middle">
                  <Col>
                    <Form.Item name="remember" valuePropName="checked" noStyle>
                      <Checkbox>Remember me</Checkbox>
                    </Form.Item>
                  </Col>
                  <Col>
                    <Link onClick={() => navigate('/forgot-password')} style={{ cursor: 'pointer' }}>
                      Forgot password?
                    </Link>
                  </Col>
                </Row>
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
                  Log in
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
      </Layout>
    </>
  );
};

export default LoginPage;
