import { PackageSearch, Shield, Sparkles, TrendingUp } from 'lucide-react';

const OPTION_CARD_STYLE = 'bg-card flex items-start rounded-md border p-3 lg:p-6';
const OPTIONS_CARD_ICON = 'text-primary h-5 w-5 lg:h-7 lg:w-7 shrink-0';
const OPTIONS_CARD_TITLE = 'text-sm lg:text-base font-bold';
const OPTIONS_CARD_DESC = 'text-muted-foreground mt-1 text-xs lg:text-sm';

function BadgeInfo() {
  return (
    <section className="container grid grid-cols-1 gap-2 lg:gap-x-4 sm:grid-cols-2 xl:grid-cols-4">
      <div className={OPTION_CARD_STYLE}>
        <Shield className={OPTIONS_CARD_ICON} />
        <div>
          <h3 className={OPTIONS_CARD_TITLE}>با تضمین فروشگاه</h3>
          <p className={OPTIONS_CARD_DESC}>
            محصولات دارای نشان تضمین، اصالت کالا را از فروشگاه ما دارند
          </p>
        </div>
      </div>
      <div className={OPTION_CARD_STYLE}>
        <Sparkles className={OPTIONS_CARD_ICON} />
        <div>
          <h3 className={OPTIONS_CARD_TITLE}>تقویت شده</h3>
          <p className={OPTIONS_CARD_DESC}>
            آگهی شما ۴ روز در بالای همه لیست‌ها می‌ماند، حتی با ثبت آگهی‌های جدید
          </p>
        </div>
      </div>
      <div className={OPTION_CARD_STYLE}>
        <TrendingUp className={OPTIONS_CARD_ICON} />
        <div>
          <h3 className={OPTIONS_CARD_TITLE}>پله شده</h3>
          <p className={OPTIONS_CARD_DESC}>
            یک‌بار به بالای لیست می‌رود و زمان انتشار آگهی به‌روز می‌شود
          </p>
        </div>
      </div>
      <div className={OPTION_CARD_STYLE}>
        <PackageSearch className={OPTIONS_CARD_ICON} />
        <div>
          <h3 className={OPTIONS_CARD_TITLE}>خرید و فروش آسان</h3>
          <p className={OPTIONS_CARD_DESC}>
            مانند دیوار، آگهی خود را ثبت کنید و محصولتان را بفروشید
          </p>
        </div>
      </div>
    </section>
  );
}

export default BadgeInfo;
