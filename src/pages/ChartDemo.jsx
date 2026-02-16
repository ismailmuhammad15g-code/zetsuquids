import { AreaChart } from "../components/retroui/charts/AreaChart";

const data = [
  { name: "Jan", orders: 12 },
  { name: "Feb", orders: 32 },
  { name: "Mar", orders: 19 },
  { name: "Apr", orders: 35 },
  { name: "May", orders: 40 },
  { name: "Jun", orders: 25 },
];

export default function ChartDemo() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black mb-8">Chart Demo</h1>

        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Single Category Chart</h2>
          <AreaChart data={data} index="name" categories={["orders"]} />
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Custom Colors</h2>
          <AreaChart
            data={data}
            index="name"
            categories={["orders"]}
            colors={["#3b82f6"]}
          />
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Multiple Data Points</h2>
          <AreaChart
            data={[
              { name: "Mon", views: 45 },
              { name: "Tue", views: 52 },
              { name: "Wed", views: 38 },
              { name: "Thu", views: 67 },
              { name: "Fri", views: 89 },
              { name: "Sat", views: 95 },
              { name: "Sun", views: 73 },
            ]}
            index="name"
            categories={["views"]}
            colors={["#10b981"]}
          />
        </div>
      </div>
    </div>
  );
}
