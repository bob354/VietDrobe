import Link from "next/link";
import Image from "next/image";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { HomeFeatured, HomeStats } from "@/components/home-inventory";

const steps = [
  { title: "Khám phá", description: "Tìm hiểu phom dáng, chất liệu và câu chuyện phía sau từng phục trang." },
  { title: "Phối đồ có kiểm định văn hóa", description: "Chọn dịp và phong cách, nhận 3 bộ phối kèm cảnh báo khi kết hợp sai lệch." },
  { title: "Đặt thuê", description: "Thêm vào giỏ, chọn số ngày; giá, giảm giá combo và tiền cọc hiện rõ." },
];

export default function Home() {
  return <div className="home-page">
    <section className="home-hero shell" aria-labelledby="hero-title">
      <div className="hero-copy">
        <h1 id="hero-title">Một nét xưa.<br /><em>Một cách mặc mới.</em></h1>
        <span className="hero-stitch" aria-hidden="true" />
        <p className="hero-intro">Khám phá cổ phục Việt, tìm một bản phối mang dấu ấn của bạn và chọn trang phục cho khoảnh khắc sắp tới.</p>
        <div className="hero-actions"><Link href="/suggest" className="button-solid">Gợi ý phối đồ <ArrowUpRight aria-hidden="true" size={17} /></Link><Link href="/catalog" className="button-outline">Khám phá cổ phục <ArrowUpRight aria-hidden="true" size={17} /></Link></div>
        <div className="hero-note"><span className="hero-note-line" /> Từ tủ đồ di sản đến ngày bạn khoác lên mình</div>
      </div>
      <div className="hero-art" aria-label="Áo Nhật Bình, phẩm phục cung đình">
        <div className="art-topline"><span>VIETDROBE / ATELIER</span><span>VIỆT NAM</span></div>
        <Image className="hero-garment" src="/garments/ao-nhat-binh-hero.webp" alt="Áo Nhật Bình màu vàng thêu phượng và sóng nước" width={900} height={941} priority />
        <div className="art-side-label">ÁO NHẬT BÌNH · PHẨM PHỤC CUNG ĐÌNH</div>
        <div className="art-caption"><span>Phom dáng được lưu truyền</span><span>ÁO NHẬT BÌNH</span></div>
      </div>
      <a href="#journey" className="scroll-cue">Cuộn để khám phá <ArrowDownRight size={15} aria-hidden="true" /></a>
    </section>
    <HomeStats />
    <section className="home-steps shell" aria-label="Hành trình">
      {steps.map((step, index) => <div key={step.title}><span>0{index + 1}</span><h3>{step.title}</h3><p>{step.description}</p></div>)}
    </section>
    <section className="home-check shell" aria-labelledby="check-title">
      <p className="home-eyebrow">Kiểm định văn hóa · ví dụ minh họa</p>
      <h2 id="check-title">Phối mới, nhưng không lệch chuẩn.</h2>
      <div className="check-grid">
        <article className="check-card">
          <header><span>Bộ phối hợp chuẩn</span><strong className="is-ok">1.00</strong></header>
          <p>Áo Tấc Đỏ Điều Thêu Họa Tiết<br />Quần Phi Lụa Trắng Ống Rộng<br />Nón Quai Thao Duyên Dáng</p>
          <div className="check-bar"><i className="is-ok" style={{ width: "100%" }} /></div>
        </article>
        <article className="check-card">
          <header><span>Cảnh báo phối đồ</span><strong>0.90</strong></header>
          <p>Áo Nhật Bình Cung Đình Thêu Phượng<br />Quần Jeans Xanh Ống Suông (Remix)</p>
          <div className="check-warning">Nhật Bình là phẩm phục cung đình, thường không phối với quần hiện đại.</div>
          <div className="check-bar"><i style={{ width: "90%" }} /></div>
        </article>
      </div>
    </section>
    <HomeFeatured />
    <section className="home-closer shell" aria-labelledby="closer-title"><BrandMark className="closer-mark" /><div><h2 id="closer-title">Di sản là thứ<br /><em>được tiếp tục mặc.</em></h2><p>Thử kết hợp cổ phục với nhịp sống của riêng bạn, rồi đặt thuê khi đã tìm được bộ đồ ưng ý.</p></div><Link href="/suggest" className="button-outline">Bắt đầu phối đồ <ArrowUpRight size={17} aria-hidden="true" /></Link></section>
  </div>;
}
