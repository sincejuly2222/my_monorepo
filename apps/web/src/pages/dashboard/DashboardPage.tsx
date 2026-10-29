import {
  CheckCircleOutlined,
  DatabaseOutlined,
  RocketOutlined,
} from "@ant-design/icons";
import { PageContainer, ProCard } from "@ant-design/pro-components";
import { Col, Row, Statistic, Typography } from "antd";

/**
 * 后台管理系统工作台占位页。
 */
export function DashboardPage() {
  return (
    <PageContainer
      title="工作台"
      subTitle="欢迎进入后台管理系统"
      content="这里是后台功能的统一入口，后续可继续添加用户、角色和系统设置等模块。"
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <ProCard bordered>
            <Statistic
              title="前端状态"
              value="运行正常"
              prefix={<CheckCircleOutlined className="text-green-500" />}
            />
          </ProCard>
        </Col>
        <Col xs={24} md={8}>
          <ProCard bordered>
            <Statistic
              title="技术栈"
              value="React 18"
              prefix={<RocketOutlined className="text-blue-500" />}
            />
          </ProCard>
        </Col>
        <Col xs={24} md={8}>
          <ProCard bordered>
            <Statistic
              title="数据服务"
              value="待接入"
              prefix={<DatabaseOutlined className="text-orange-500" />}
            />
          </ProCard>
        </Col>
      </Row>

      <ProCard className="mt-4" bordered title="开始使用">
        <Typography.Paragraph className="mb-0">
          使用左侧菜单访问后台功能。当前已完成基础布局与路由，后续页面可以继续放在
          <Typography.Text code>src/pages</Typography.Text>
          目录中。
        </Typography.Paragraph>
      </ProCard>
    </PageContainer>
  );
}
