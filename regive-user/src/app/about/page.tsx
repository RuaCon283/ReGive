import React from 'react';
import Link from 'next/link';
import { Button } from 'antd';
import {
  Heart,
  ShieldCheck,
  Repeat,
  Users,
  Target,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="space-y-16 pb-20">
      {/* Hero */}
      <section className="bg-gradient-to-b from-p-s50/70 via-sec-s50/30 to-slate-50 py-16 sm:py-24 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-p-s100 text-p-s700 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sứ mệnh nhân văn bền vững</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">
            Về ReGive — Nền Tảng Trao Tặng Tuần Hoàn
          </h1>
          <p className="mt-4 text-base sm:text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
            Chúng tôi tin rằng sự sẻ chia không chỉ dừng lại ở lòng tốt tức thời, mà có thể trở thành một chu trình bền vững, minh bạch và tạo ra giá trị lâu dài cho xã hội.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-p-s100 text-p-s700 flex items-center justify-center font-bold">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-black text-gray-900">Sứ Mệnh Của Chúng Tôi</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Kết nối những người có tấm lòng hảo tâm, các tình nguyện viên nhiệt huyết và những hoàn cảnh cần được giúp đỡ vào một mạng lưới minh bạch. ReGive giảm thiểu tối đa tình trạng lãng phí vật phẩm còn giá trị sử dụng bằng mô hình thẩm định, tuần hoàn và tái phân phối thông minh.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-sec-s100 text-sec-s700 flex items-center justify-center font-bold">
            <Repeat className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-black text-gray-900">Mô Hình Tuần Hoàn</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Mỗi món đồ bạn không còn dùng đến sẽ được vệ sinh, kiểm tra chất lượng và trao tặng trực tiếp cho người cần hoặc bán gây quỹ trên Marketplace. Toàn bộ dòng tiền thu được đều được chuyển về quỹ của chiến dịch với sự giám sát chặt chẽ.
          </p>
        </div>
      </section>

      {/* 3 Core Values */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-black text-gray-900">Giá Trị Cốt Lõi</h2>
          <p className="text-sm text-gray-500 mt-2">
            Ba trụ cột định hình nên phong cách làm việc và cam kết của ReGive với cộng đồng.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-xl bg-p-s50 text-p-s600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-gray-900 text-lg">Minh Bạch Tuyệt Đối</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Mọi khoản tiền ủng hộ và giao dịch mua sắm đều được sao kê tự động theo thời gian thực.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-xl bg-sec-s50 text-sec-s600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-gray-900 text-lg">Đúng Người, Đúng Việc</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Các yêu cầu hỗ trợ được xác minh hoàn cảnh chu đáo, bảo đảm nguồn lực đến tận tay người cần nhất.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-xl bg-sec-s50 text-sec-s600 flex items-center justify-center">
              <Heart className="w-6 h-6 fill-sec-s600 text-sec-s600" />
            </div>
            <h4 className="font-bold text-gray-900 text-lg">Tôn Trọng & Nhân Ái</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Trao đi bằng sự đồng cảm và trân trọng phẩm giá của mỗi con người trong cộng đồng.
            </p>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="max-w-4xl mx-auto px-4 text-center">
        <div className="bg-gradient-to-br from-p-s100 via-sec-s50 to-i-s50 rounded-3xl p-10 space-y-4 shadow-md border-2 border-p-s200/30">
          <h3 className="text-2xl sm:text-3xl font-black text-n-s900">Cùng ReGive Tạo Nên Sự Khác Biệt</h3>
          <p className="text-xs sm:text-sm text-n-s500 max-w-xl mx-auto">
            Mỗi hành động nhỏ đều góp phần thắp lên hy vọng cho một mảnh đời. Hãy chọn chiến dịch bạn quan tâm ngay hôm nay!
          </p>
          <div className="pt-2">
            <Link href="/campaigns">
              <Button
                type="primary"
                size="large"
                className="h-12 px-8 rounded-xl bg-p-s500 hover:bg-p-s600 text-white font-bold text-sm"
              >
                Khám phá chiến dịch ngay
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
