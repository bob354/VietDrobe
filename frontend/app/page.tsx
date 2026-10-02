import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

const paths = [
  { title: "Khám phá tủ đồ", description: "Tìm hiểu phom dáng, chất liệu và câu chuyện phía sau từng phục trang.", href: "/catalog", action: "Xem bộ sưu tập" },
  { title: "Tạo bản phối riêng", description: "Chọn một dịp đặc biệt, rồi để stylist gợi ý cách phối phù hợp.", href: "/suggest", action: "Bắt đầu phối đồ" },
];

export default function Home() {
  return <div className="home-page">
    <section className="home-hero shell" aria-labelledby="hero-title">
      <div className="hero-copy">
        <h1 id="hero-title">Một nét xưa.<br /><em>Một cách mặc mới.</em></h1>
        <p className="hero-intro">Khám phá cổ phục Việt, tìm một bản phối mang dấu ấn của bạn và chọn trang phục cho khoảnh khắc sắp tới.</p>
        <div className="hero-actions"><Link href="/catalog" className="button-solid">Khám phá cổ phục <ArrowUpRight aria-hidden="true" size={17} /></Link><Link href="/suggest" className="button-outline">Gợi ý phối đồ <ArrowUpRight aria-hidden="true" size={17} /></Link></div>
        <div className="hero-note"><span className="hero-note-line" /> Từ tủ đồ di sản đến ngày bạn khoác lên mình</div>
      </div>
      <div className="hero-art" aria-label="Minh họa nét cắt áo ngũ thân bằng đường chỉ">
        <div className="art-topline"><span>VIETDROBE / ATELIER</span><span>VIỆT NAM</span></div>
        <svg className="robe-drawing" viewBox="0 0 520 600" role="img" aria-label="Hình nét áo ngũ thân">
          <path className="robe-outline" d="M208 94 156 122 80 198 35 310 112 340 155 271 160 520 363 520 367 271 408 340 485 310 440 198 364 122 312 94" />
          <path className="robe-outline" d="M208 94c12 32 31 54 52 65 21-11 40-33 52-65M155 122l-2 141m212-141 2 141M260 159l-12 361m26-361 14 361M160 520h203" />
          <path className="robe-detail" d="M209 95 260 174l-12 346M311 95l-51 79 28 346M110 335l45-75m253 75-41-75M187 392h52m43 0h52" />
          <circle cx="255" cy="207" r="3"/><circle cx="253" cy="254" r="3"/><circle cx="251" cy="301" r="3"/><circle cx="249" cy="348" r="3"/><circle cx="247" cy="395" r="3"/>
        </svg>
        <div className="art-side-label">ÁO NGŨ THÂN · NÉT CẮT DI SẢN</div>
        <div className="art-caption"><span>Phom dáng được lưu truyền</span><span>NÉT CẮT ÁO NGŨ THÂN</span></div>
      </div>
      <a href="#journey" className="scroll-cue">Cuộn để khám phá <ArrowDownRight size={15} aria-hidden="true" /></a>
    </section>
    <section className="home-paths" id="journey" aria-labelledby="paths-title"><div className="shell"><div className="section-heading"><h2 id="paths-title">Bắt đầu từ điều bạn cần.</h2><p>Chọn một món mình yêu thích, hoặc tìm cảm hứng cho cả bộ trang phục.</p></div><div className="path-grid">{paths.map(path => <Link className="path-link" href={path.href} key={path.href}><div><h3>{path.title}</h3><p>{path.description}</p></div><span className="path-action">{path.action} <ArrowUpRight size={18} aria-hidden="true" /></span></Link>)}</div></div></section>
    <section className="home-closer shell" aria-labelledby="closer-title"><div className="closer-mark" aria-hidden="true">V</div><div><h2 id="closer-title">Di sản là thứ<br /><em>được tiếp tục mặc.</em></h2><p>Thử kết hợp cổ phục với nhịp sống của riêng bạn, rồi đặt thuê khi đã tìm được bộ đồ ưng ý.</p></div><Link href="/suggest" className="button-outline">Bắt đầu phối đồ <ArrowUpRight size={17} aria-hidden="true" /></Link></section>
  </div>;
}
