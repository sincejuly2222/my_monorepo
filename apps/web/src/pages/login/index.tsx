import {
  CheckCircleOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { App, Button, Form, Input, Typography } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "./services";
import styles from "./index.module.css";

interface LoginFormValues {
  username: string;
  password: string;
}

const capabilities = ["人员资料维护", "角色信息管理", "Excel 数据导入"];

/** 后台管理系统登录入口。 */
export function LoginPage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(values: LoginFormValues): Promise<void> {
    setSubmitting(true);

    try {
      await login({
        username: values.username.trim(),
        password: values.password,
      });
      message.success("登录成功");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      message.error(error instanceof Error ? error.message : "登录失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.brandPanel} aria-label="系统简介">
        <div className={styles.brandContent}>
          <div className={styles.brandName}>
            <span className={styles.brandMark} aria-hidden="true">
              A
            </span>
            <span>后台管理系统</span>
          </div>

          <div className={styles.brandCopy}>
            <Typography.Text className={styles.brandEyebrow}>ADMIN WORKSPACE</Typography.Text>
            <p className={styles.brandTitle}>统一管理人员与角色信息</p>
            <Typography.Paragraph>
              集中维护基础资料与日常管理任务，让后台操作保持清晰、有序。
            </Typography.Paragraph>
          </div>

          <ul className={styles.capabilityList} aria-label="系统能力">
            {capabilities.map((capability) => (
              <li key={capability}>
                <CheckCircleOutlined aria-hidden="true" />
                <span>{capability}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.brandVisual} aria-hidden="true">
          <div className={styles.brandOrbit + " " + styles.brandOrbitOuter} />
          <div className={styles.brandOrbit + " " + styles.brandOrbitInner} />
          <SafetyCertificateOutlined />
        </div>
      </section>

      <section className={styles.formPanel} aria-labelledby="login-form-title">
        <div className={styles.mobileBrand} aria-label="后台管理系统">
          <span className={styles.brandMark} aria-hidden="true">
            A
          </span>
          <span>后台管理系统</span>
        </div>

        <div className={styles.formContent}>
          <div className={styles.formHeading}>
            <Typography.Title id="login-form-title" level={1}>
              欢迎登录
            </Typography.Title>
            <Typography.Paragraph>请输入用户名和密码进入管理后台。</Typography.Paragraph>
          </div>

          <Form<LoginFormValues>
            layout="vertical"
            requiredMark={false}
            size="large"
            onFinish={handleSubmit}
          >
            <Form.Item
              label="用户名"
              name="username"
              rules={[{ required: true, whitespace: true, message: "请输入用户名" }]}
            >
              <Input
                autoFocus
                autoComplete="username"
                prefix={<UserOutlined aria-hidden="true" />}
                placeholder="请输入用户名"
              />
            </Form.Item>

            <Form.Item
              label="密码"
              name="password"
              rules={[{ required: true, message: "请输入密码" }]}
            >
              <Input
                autoComplete="current-password"
                prefix={<LockOutlined aria-hidden="true" />}
                placeholder="请输入密码"
                type={passwordVisible ? "text" : "password"}
                suffix={
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    aria-label={passwordVisible ? "隐藏密码" : "显示密码"}
                    aria-pressed={passwordVisible}
                    onClick={() => setPasswordVisible((visible) => !visible)}
                  >
                    {passwordVisible ? (
                      <EyeInvisibleOutlined aria-hidden="true" />
                    ) : (
                      <EyeOutlined aria-hidden="true" />
                    )}
                  </button>
                }
              />
            </Form.Item>

            <Form.Item className={styles.submitItem}>
              <Button type="primary" htmlType="submit" block loading={submitting}>
                登录
              </Button>
            </Form.Item>
          </Form>

          <Typography.Text className={styles.formNote}>
            登录状态将通过安全 Cookie 保存，请勿在公共设备上保留登录会话。
          </Typography.Text>
        </div>

        <Typography.Text className={styles.copyright}>
          © {new Date().getFullYear()} 后台管理系统
        </Typography.Text>
      </section>
    </main>
  );
}
