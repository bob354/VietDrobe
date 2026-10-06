"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Garment } from "@/lib/types";

// One request shared by every block on the home page.
let inventory: Promise<Garment[]> | null = null;
function loadInventory(): Promise<Garment[]> {
  if (!inventory) {
    inventory = api.getGarments({ limit: 200 }).then((res) => res.items).catch((error) => {
      inventory = null;
      throw error;
    });
  }
  return inventory;
}

function useInventory() {
  const [items, setItems] = useState<Garment[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    loadInventory().then((list) => alive && setItems(list)).catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);
  return { items, failed };
}

/** Numbers come from the inventory itself, so they never go stale. */
export function HomeStats() {
  const { items, failed } = useInventory();
  if (failed) return null;
  const count = (pick: (g: Garment) => string | undefined) =>
    items ? new Set(items.map(pick).filter(Boolean)).size : null;
  const stats = [
    { value: count((g) => g.type), label: "Loại trang phục" },
    { value: items ? items.length : null, label: "Mẫu trong kho" },
    { value: count((g) => g.category), label: "Nhóm trang phục" },
    { value: count((g) => g.era), label: "Thời kỳ lịch sử" },
  ];
  return (
    <section className="home-stats shell" id="journey" aria-label="Quy mô tủ đồ">
      {stats.map((stat) => (
        <div key={stat.label}>
          <strong>{stat.value ?? "—"}</strong>
          <span>{stat.label}</span>
        </div>
      ))}
    </section>
  );
}

/** One piece per category first, so the strip shows variety rather than four tops. */
function pickFeatured(items: Garment[]): Garment[] {
  const seen = new Set<string>();
  const picked: Garment[] = [];
  for (const garment of items) {
    if (!seen.has(garment.category)) {
      seen.add(garment.category);
      picked.push(garment);
    }
    if (picked.length === 4) break;
  }
  for (const garment of items) {
    if (picked.length === 4) break;
    if (!picked.includes(garment)) picked.push(garment);
  }
  return picked;
}

export function HomeFeatured() {
  const { items, failed } = useInventory();
  if (failed) return null;
  const featured = items ? pickFeatured(items) : null;
  return (
    <section className="home-featured shell" aria-labelledby="featured-title">
      <div className="featured-head">
        <h2 id="featured-title">Từ tủ đồ</h2>
        <Link href="/catalog">Xem tất cả <ArrowUpRight size={15} aria-hidden="true" /></Link>
      </div>
      <div className="featured-grid">
        {(featured ?? [null, null, null, null]).map((garment, index) =>
          garment ? (
            <Link href="/catalog" className="featured-item" key={garment.id}>
              <div className="featured-arch">
                <Image src={garment.thumbnail_url || garment.image_url || garment.image_path} alt={garment.display_name} fill sizes="(max-width: 760px) 50vw, 25vw" />
              </div>
              <span>{garment.display_name}</span>
            </Link>
          ) : (
            <div className="featured-item" key={index} aria-hidden="true"><div className="featured-arch" /></div>
          ),
        )}
      </div>
    </section>
  );
}
