import React, { useState, useEffect } from 'react';
import { Card, Tabs, Row, Col, Statistic, Table, DatePicker, Select, Button, Alert } from 'antd';
import { UserOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { Line, Pie, Bar } from '@ant-design/plots';
import moment from 'moment';
import { getAccessLogs, getAccessStatistics } from '../services/databaseService';

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { Option } = Select;

const AdminDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [accessLogs, setAccessLogs] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [dateRange, setDateRange] = useState([moment().subtract(7, 'days'), moment()]);
  const [location, setLocation] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // تحميل البيانات عند تغيير المرشحات
  useEffect(() => {
    fetchData();
  }, [dateRange, location, currentPage, pageSize]);

  // جلب البيانات من الخادم
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // تحضير المعلمات
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');
      
      // جلب الإحصائيات
      const statsResponse = await getAccessStatistics({
        start_date: startDate,
        end_date: endDate,
        location: location
      });
      
      setStatistics(statsResponse);
      
      // جلب سجلات الوصول
      const logsResponse = await getAccessLogs({
        start_date: startDate,
        end_date: endDate,
        location: location,
        limit: pageSize,
        offset: (currentPage - 1) * pageSize
      });
      
      setAccessLogs(logsResponse.logs);
      setTotalCount(logsResponse.total);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('حدث خطأ أثناء جلب البيانات. الرجاء المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  // تغيير نطاق التاريخ
  const handleDateRangeChange = (dates) => {
    if (dates && dates.length === 2) {
      setDateRange(dates);
    }
  };

  // تغيير الموقع
  const handleLocationChange = (value) => {
    setLocation(value);
  };

  // تغيير الصفحة
  const handlePageChange = (page, pageSize) => {
    setCurrentPage(page);
    setPageSize(pageSize);
  };

  // تكوين مخطط الخط للوصول حسب اليوم
  const getLineChartConfig = () => {
    if (!statistics || !statistics.by_day) return null;
    
    const data = Object.entries(statistics.by_day).map(([date, count]) => ({
      date,
      count
    }));
    
    return {
      data,
      xField: 'date',
      yField: 'count',
      seriesField: 'type',
      smooth: true,
      xAxis: {
        type: 'time',
      },
      yAxis: {
        label: {
          formatter: (v) => `${v}`,
        },
      },
      tooltip: {
        showMarkers: false,
      },
      point: {
        shape: 'circle',
      },
    };
  };

  // تكوين مخطط الدائرة للوصول حسب الموقع
  const getPieChartConfig = () => {
    if (!statistics || !statistics.by_location) return null;
    
    const data = Object.entries(statistics.by_location).map(([location, count]) => ({
      type: location || 'غير محدد',
      value: count
    }));
    
    return {
      data,
      angleField: 'value',
      colorField: 'type',
      radius: 0.8,
      label: {
        type: 'outer',
        content: '{name} {percentage}',
      },
      interactions: [
        {
          type: 'pie-legend-active',
        },
        {
          type: 'element-active',
        },
      ],
    };
  };

  // تكوين مخطط الأعمدة للوصول حسب الساعة
  const getBarChartConfig = () => {
    if (!statistics || !statistics.by_hour) return null;
    
    const data = Object.entries(statistics.by_hour).map(([hour, count]) => ({
      hour: `${hour}:00`,
      count
    }));
    
    return {
      data,
      xField: 'hour',
      yField: 'count',
      columnWidthRatio: 0.8,
      label: {
        position: 'middle',
        style: {
          fill: '#FFFFFF',
          opacity: 0.6,
        },
      },
      meta: {
        hour: {
          alias: 'الساعة',
        },
        count: {
          alias: 'عدد محاولات الوصول',
        },
      },
      tooltip: {
        formatter: (datum) => {
          return { name: 'عدد محاولات الوصول', value: datum.count };
        },
      },
    };
  };

  // أعمدة جدول سجلات الوصول
  const columns = [
    {
      title: 'الوقت',
      dataIndex: 'access_time',
      key: 'access_time',
      render: (text) => moment(text).format('YYYY-MM-DD HH:mm:ss'),
      sorter: (a, b) => moment(a.access_time).unix() - moment(b.access_time).unix(),
    },
    {
      title: 'المستخدم',
      dataIndex: 'user',
      key: 'user',
      render: (user) => user ? user.name : 'غير معروف',
    },
    {
      title: 'نوع المستخدم',
      dataIndex: 'user',
      key: 'user_type',
      render: (user) => user ? user.user_type : '-',
      filters: [
        { text: 'ضيف', value: 'guest' },
        { text: 'موظف', value: 'employee' },
        { text: 'VIP', value: 'vip' },
      ],
      onFilter: (value, record) => record.user && record.user.user_type === value,
    },
    {
      title: 'الموقع',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: 'النتيجة',
      dataIndex: 'success',
      key: 'success',
      render: (success) => (
        <span style={{ color: success ? '#52c41a' : '#f5222d' }}>
          {success ? <CheckCircleOutlined /> : <CloseCircleOutlined />} {success ? 'نجاح' : 'فشل'}
        </span>
      ),
      filters: [
        { text: 'نجاح', value: true },
        { text: 'فشل', value: false },
      ],
      onFilter: (value, record) => record.success === value,
    },
    {
      title: 'نسبة الثقة',
      dataIndex: 'confidence',
      key: 'confidence',
      render: (confidence) => `${(confidence * 100).toFixed(1)}%`,
      sorter: (a, b) => a.confidence - b.confidence,
    },
  ];

  return (
    <div className="admin-dashboard">
      <Card title="لوحة تحكم المسؤول" className="dashboard-card">
        {/* أدوات التصفية */}
        <div className="filter-container">
          <Row gutter={16} align="middle">
            <Col>
              <span className="filter-label">نطاق التاريخ:</span>
              <RangePicker
                value={dateRange}
                onChange={handleDateRangeChange}
                format="YYYY-MM-DD"
              />
            </Col>
            <Col>
              <span className="filter-label">الموقع:</span>
              <Select
                placeholder="جميع المواقع"
                style={{ width: 150 }}
                onChange={handleLocationChange}
                value={location}
                allowClear
              >
                <Option value="main_entrance">المدخل الرئيسي</Option>
                <Option value="restaurant">المطعم</Option>
                <Option value="pool">المسبح</Option>
                <Option value="gym">الصالة الرياضية</Option>
                <Option value="spa">السبا</Option>
              </Select>
            </Col>
            <Col>
              <Button type="primary" onClick={fetchData} loading={loading}>
                تحديث
              </Button>
            </Col>
          </Row>
        </div>

        {/* عرض الخطأ إذا وجد */}
        {error && (
          <Alert
            message="خطأ"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* الإحصائيات */}
        {statistics && (
          <div className="statistics-container">
            <Row gutter={16}>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="إجمالي محاولات الوصول"
                    value={statistics.total_attempts}
                    prefix={<ClockCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="محاولات ناجحة"
                    value={statistics.successful_attempts}
                    valueStyle={{ color: '#3f8600' }}
                    prefix={<CheckCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="محاولات فاشلة"
                    value={statistics.failed_attempts}
                    valueStyle={{ color: '#cf1322' }}
                    prefix={<CloseCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="مستخدمين فريدين"
                    value={statistics.unique_users}
                    prefix={<UserOutlined />}
                  />
                </Card>
              </Col>
            </Row>
          </div>
        )}

        {/* علامات التبويب للمخططات والسجلات */}
        <Tabs defaultActiveKey="1" className="dashboard-tabs">
          <TabPane tab="المخططات" key="1">
            <div className="charts-container">
              {statistics && (
                <>
                  <Row gutter={16}>
                    <Col span={24}>
                      <Card title="محاولات الوصول حسب اليوم" className="chart-card">
                        {getLineChartConfig() && <Line {...getLineChartConfig()} />}
                      </Card>
                    </Col>
                  </Row>
                  <Row gutter={16} style={{ marginTop: 16 }}>
                    <Col span={12}>
                      <Card title="محاولات الوصول حسب الموقع" className="chart-card">
                        {getPieChartConfig() && <Pie {...getPieChartConfig()} />}
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card title="محاولات الوصول حسب الساعة" className="chart-card">
                        {getBarChartConfig() && <Bar {...getBarChartConfig()} />}
                      </Card>
                    </Col>
                  </Row>
                </>
              )}
            </div>
          </TabPane>
          <TabPane tab="سجلات الوصول" key="2">
            <Table
              columns={columns}
              dataSource={accessLogs}
              rowKey="id"
              loading={loading}
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: totalCount,
                onChange: handlePageChange,
                showSizeChanger: true,
                showTotal: (total) => `إجمالي ${total} سجل`,
              }}
            />
          </TabPane>
        </Tabs>
      </Card>

      <style jsx>{`
        .admin-dashboard {
          padding: 24px;
        }
        
        .dashboard-card {
          margin-bottom: 24px;
        }
        
        .filter-container {
          margin-bottom: 24px;
          padding: 16px;
          background-color: #f5f5f5;
          border-radius: 4px;
        }
        
        .filter-label {
          margin-right: 8px;
          font-weight: 500;
        }
        
        .statistics-container {
          margin-bottom: 24px;
        }
        
        .dashboard-tabs {
          margin-top: 24px;
        }
        
        .charts-container {
          padding: 16px 0;
        }
        
        .chart-card {
          height: 100%;
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
