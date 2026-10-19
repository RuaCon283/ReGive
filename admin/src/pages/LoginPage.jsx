import { Leaf } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, ErrorBox, Field, Input } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { DEMO_ACCOUNTS, LABELS } from '../lib/constants';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-forest text-sand lg:flex">
        <div className="grain absolute inset-0" />
        <div className="relative flex flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lime text-ink">
              <Leaf size={22} aria-hidden="true" />
            </span>
            <div>
              <p className="font-display text-2xl text-lime">ReGive</p>
              <p className="text-xs tracking-[0.22em] text-sand/50 uppercase">Admin console</p>
            </div>
          </div>
          <div>
            <p className="font-display max-w-md text-5xl leading-[1.1] text-white">
              Vận hành từ thiện và marketplace second-hand trên một bảng điều khiển.
            </p>
            <p className="mt-6 max-w-md text-sm leading-6 text-sand/70">
              Chiến dịch, quyên góp, kho, đơn hàng, thanh toán và AI đánh giá sản phẩm — human-in-the-loop,
              không tự publish lên marketplace.
            </p>
          </div>
          <p className="text-xs text-sand/40">Sprint 1–3 · Node.js API · React + Tailwind</p>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-12">
        <form onSubmit={onSubmit} noValidate className="w-full max-w-md space-y-6">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-moss uppercase">Đăng nhập</p>
            <h1 className="font-display mt-2 text-4xl text-ink">Chào mừng trở lại</h1>
            <p className="mt-2 text-sm text-ink/60">Chỉ tài khoản Admin hoặc Nhân viên mới vào được.</p>
          </div>

          <ErrorBox error={error} />

          <Field label="Email">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </Field>
          <Field label="Mật khẩu">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </Field>

          <Button type="submit" className="w-full py-3" loading={loading}>
            {loading ? 'Đang đăng nhập…' : 'Vào bảng điều khiển'}
          </Button>

          <div className="space-y-2">
            <p className="text-xs tracking-wide text-ink/45 uppercase">Tài khoản demo</p>
            <div className="flex flex-wrap gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  aria-label={`Dùng tài khoản demo ${LABELS.role[acc.role]}`}
                  className="min-h-11 rounded-full border border-forest/10 bg-white px-3 py-1.5 text-xs text-forest transition hover:border-moss/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss"
                  onClick={() => {
                    // Chỉ điền email demo; mật khẩu người dùng phải tự nhập
                    setEmail(acc.email);
                    setPassword('');
                  }}
                >
                  {LABELS.role[acc.role]}
                </button>
              ))}
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
