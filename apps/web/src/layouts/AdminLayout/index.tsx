import {
  ContactsOutlined,
  DashboardOutlined,
  LogoutOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { ProLayout, type MenuDataItem } from "@ant-design/pro-components";
import { App, Dropdown, Spin } from "antd";
import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { HttpError } from "../../api";
import { getCurrentAdmin, logout, type AuthenticatedAdmin } from "../../pages/login/services";

const menuRoutes: MenuDataItem[] = [
  {
    path: "/dashboard",
    name: "工作台",
    icon: <DashboardOutlined />,
  },
  {
    path: "/users",
    name: "用户管理",
    icon: <ContactsOutlined />,
  },
  {
    path: "/roles",
    name: "角色管理",
    icon: <TeamOutlined />,
  },
];

/**
 * 后台管理系统公共布局，负责侧边菜单、顶部栏和内容区域。
 */
export function AdminLayout() {
  const { message } = App.useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [currentAdmin, setCurrentAdmin] = useState<AuthenticatedAdmin | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;

    void getCurrentAdmin()
      .then(({ data }) => {
        if (active) {
          setCurrentAdmin(data.user);
        }
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }

        if (!(error instanceof HttpError && error.status === 401)) {
          message.error(error instanceof Error ? error.message : "登录状态校验失败");
        }

        navigate("/login", { replace: true });
      });

    return () => {
      active = false;
    };
  }, [message, navigate]);

  async function handleLogout(): Promise<void> {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      await logout();
      message.success("已退出登录");
      navigate("/login", { replace: true });
    } catch (error) {
      message.error(error instanceof Error ? error.message : "退出登录失败，请稍后重试");
      setLoggingOut(false);
    }
  }

  if (!currentAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status">
        <Spin size="large" tip="正在验证登录状态">
          <div className="h-12 w-48" />
        </Spin>
      </div>
    );
  }

  return (
    <ProLayout
      title="后台管理系统"
      logo={
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-bold text-white">
          A
        </div>
      }
      layout="side"
      location={location}
      route={{
        path: "/",
        routes: menuRoutes,
      }}
      menu={{ locale: false }}
      fixedHeader
      fixSiderbar
      contentWidth="Fluid"
      avatarProps={{
        icon: <UserOutlined />,
        title: currentAdmin.displayName,
        render: (_avatarProps, avatarDom) => (
          <Dropdown
            placement="bottomRight"
            trigger={["click"]}
            menu={{
              items: [
                {
                  key: "logout",
                  icon: <LogoutOutlined />,
                  label: loggingOut ? "正在退出…" : "退出登录",
                  disabled: loggingOut,
                  onClick: () => void handleLogout(),
                },
              ],
            }}
          >
            <span className="inline-flex cursor-pointer items-center">{avatarDom}</span>
          </Dropdown>
        ),
      }}
      onMenuHeaderClick={() => navigate("/dashboard")}
      menuItemRender={(item, defaultDom) =>
        item.path ? <Link to={item.path}>{defaultDom}</Link> : defaultDom
      }
      footerRender={() => (
        <div className="py-4 text-center text-sm text-gray-500">后台管理系统</div>
      )}
    >
      <Outlet />
    </ProLayout>
  );
}
