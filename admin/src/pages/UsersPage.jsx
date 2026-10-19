import { useState } from 'react';
import { Lock, Unlock } from 'lucide-react';
import { authApi } from '../api/client';
import { Badge, Card, DataState, FilterSelect, PageHeader, Select, Table, TableSkeleton } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LABELS, ROLES } from '../lib/constants';
import { formatDate, oid } from '../lib/format';
import { useAsync } from '../lib/hooks';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const [role, setRole] = useState('');
  const { data, loading, error, reload } = useAsync(() => authApi.users({ role }), [role]);
  const users = data?.data?.users || [];

  const isSelf = (row) => Boolean(currentUser) && oid(row) === oid(currentUser);

  async function handleRoleChange(row, newRole) {
    if (newRole === row.role) return;
    try {
      await authApi.updateRole(oid(row), newRole);
      toast.success('Đã cập nhật vai trò');
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleToggleStatus(row) {
    try {
      await authApi.updateStatus(oid(row), !row.isActive);
      toast.success(row.isActive ? 'Đã khoá tài khoản' : 'Đã mở khoá tài khoản');
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title="Người dùng"
        description="Quản lý tài khoản: đổi vai trò, khoá/mở khoá. Không thể thao tác trên chính tài khoản đang đăng nhập."
      />
      <div className="mb-4 max-w-xs">
        <FilterSelect
          label="Lọc theo vai trò"
          value={role}
          onChange={setRole}
          options={Object.values(ROLES).map((value) => ({ value, label: LABELS.role[value] }))}
        />
      </div>
      <DataState
        loading={loading}
        error={error}
        isEmpty={!users.length}
        onRetry={reload}
        skeleton={<TableSkeleton rows={6} columns={6} />}
        emptyTitle="Không có người dùng"
        emptyDescription="Thử chọn vai trò khác."
      >
        <Card>
          <Table
            label="Danh sách người dùng"
            rowKey={(row) => oid(row)}
            rows={users}
            columns={[
              {
                key: 'name',
                header: 'Họ tên',
                render: (row) => (
                  <div>
                    <p className="font-medium">{row.fullName}</p>
                    <p className="text-xs text-ink/50">{row.email}</p>
                  </div>
                ),
              },
              {
                key: 'role',
                header: 'Vai trò',
                render: (row) =>
                  isSelf(row) ? (
                    <Badge value={row.role} map={LABELS.role} />
                  ) : (
                    <Select value={row.role} onChange={(e) => handleRoleChange(row, e.target.value)}>
                      {Object.values(ROLES).map((r) => (
                        <option key={r} value={r}>
                          {LABELS.role[r]}
                        </option>
                      ))}
                    </Select>
                  ),
              },
              { key: 'phone', header: 'Điện thoại', render: (row) => row.phone || '—' },
              {
                key: 'active',
                header: 'Tài khoản',
                render: (row) => (row.isActive ? 'Hoạt động' : 'Khoá'),
              },
              {
                key: 'bene',
                header: 'Hộ gia đình',
                render: (row) =>
                  row.role === 'BENEFICIARY' ? row.beneficiaryInfo?.householdSize || '—' : '—',
              },
              { key: 'at', header: 'Tạo lúc', render: (row) => formatDate(row.createdAt) },
              {
                key: 'actions',
                header: '',
                className: 'text-right',
                render: (row) =>
                  isSelf(row) ? null : (
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(row)}
                      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm font-medium cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss ${
                        row.isActive ? 'text-rose hover:bg-rose/10' : 'text-moss hover:bg-ink/5'
                      }`}
                    >
                      {row.isActive ? <Lock size={16} /> : <Unlock size={16} />}
                      {row.isActive ? 'Khoá' : 'Mở khoá'}
                    </button>
                  ),
              },
            ]}
          />
        </Card>
      </DataState>
    </div>
  );
}
