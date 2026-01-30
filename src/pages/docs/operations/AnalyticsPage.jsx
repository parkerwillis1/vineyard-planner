import DocsLayout from "../DocsLayout";
import { DocsHeader, Section, Subsection, Callout, Table, NextSteps } from "../DocsComponents";

export default function AnalyticsPage() {
  return (
    <DocsLayout>
      <DocsHeader
        title="Analytics Dashboard"
        subtitle="Track vineyard performance with key metrics, trend analysis, yield comparisons, and data-driven insights across blocks and seasons."
      />

      <Callout type="note" title="Beta v1.0">
        Analytics Dashboard is ready to use with core metrics and visualizations. Advanced predictive analytics features coming in future releases.
      </Callout>

      <Section title="Overview">
        <p>
          The Analytics Dashboard transforms your vineyard data into actionable insights. View trends over time, compare block performance, identify high/low yielders, and make data-driven decisions about irrigation, nutrition, and harvest timing.
        </p>
        <p>
          Analytics pulls data from all modules—blocks, irrigation, tasks, sprays, and harvest records—to provide a comprehensive view of vineyard health and productivity.
        </p>
      </Section>

      <Section title="Key Performance Indicators (KPIs)">
        <Subsection title="Yield Metrics">
          <p>
            Track production across blocks and years:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Total Tons Harvested:</strong> Season-to-date and historical totals</li>
            <li><strong>Tons per Acre:</strong> Normalized yield for block comparison</li>
            <li><strong>Average Brix:</strong> Vineyard-wide sugar content at harvest</li>
            <li><strong>Yield Variance:</strong> Standard deviation across blocks (identifies inconsistency)</li>
          </ul>
          <Table
            headers={["Metric", "Calculation", "Target Range"]}
            rows={[
              ["Tons/Acre", "Total harvest ÷ acres", "2.5-4.5 for premium wine grapes"],
              ["Brix at Harvest", "Weighted average by tons", "23-26° for red wine grapes"],
              ["pH Average", "Weighted average by tons", "3.3-3.6 for balanced acidity"],
            ]}
          />
        </Subsection>

        <Subsection title="Water Use Efficiency">
          <p>
            Monitor irrigation effectiveness and conservation:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Total Water Applied:</strong> Gallons and acre-feet per season</li>
            <li><strong>Water per Ton:</strong> Gallons used to produce 1 ton of grapes</li>
            <li><strong>ET vs. Irrigation:</strong> Compare crop water use (ET) to applied water</li>
            <li><strong>Deficit Days:</strong> Number of days with water stress</li>
          </ul>
          <Callout type="tip" title="Water Efficiency Benchmark">
            High-efficiency vineyards achieve 0.8-1.2 ton per acre-foot of water. If you're using more than 1.5 acre-feet per ton, look for irrigation leaks or scheduling inefficiencies.
          </Callout>
        </Subsection>

        <Subsection title="Task Completion Rates">
          <p>
            Measure team productivity and identify bottlenecks:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>On-Time Completion:</strong> % of tasks completed by due date</li>
            <li><strong>Overdue Tasks:</strong> Count of past-due incomplete tasks</li>
            <li><strong>Average Completion Time:</strong> Days from assignment to completion</li>
            <li><strong>Crew Productivity:</strong> Tasks completed per crew member</li>
          </ul>
        </Subsection>

        <Subsection title="Spray Program Efficiency">
          <p>
            Analyze pest/disease management costs and effectiveness:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Spray Cycles per Season:</strong> Total applications across all blocks</li>
            <li><strong>Cost per Acre:</strong> Material + labor cost for spray program</li>
            <li><strong>Disease Pressure:</strong> Track incidence over time from harvest samples</li>
            <li><strong>Compliance Rate:</strong> PHI/REI violations (should be 0%)</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Trend Analysis">
        <Subsection title="Multi-Year Yield Trends">
          <p>
            Compare yield performance across vintages:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Line chart showing tons/acre by year for each block</li>
            <li>Identify declining blocks (potential replant candidates)</li>
            <li>Spot vintage effects (weather-driven year-to-year variation)</li>
            <li>Calculate 5-year rolling average for baseline expectation</li>
          </ul>
        </Subsection>

        <Subsection title="Maturity Progression">
          <p>
            Track Brix/pH/TA evolution during harvest season:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Plot berry sample data over time (4-8 weeks pre-harvest)</li>
            <li>See Brix accumulation rate (°Brix per week)</li>
            <li>Monitor pH drop and TA decline curves</li>
            <li>Predict optimal harvest date based on trend lines</li>
          </ul>
          <Callout type="tip" title="Harvest Timing">
            Most varieties gain 1-1.5° Brix per week during ripening. If samples show 23° Brix and target is 25°, harvest in 10-14 days (weather permitting).
          </Callout>
        </Subsection>

        <Subsection title="Water Use Over Time">
          <p>
            Visualize seasonal irrigation patterns:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Stacked area chart: ET (crop water use) vs. irrigation applied</li>
            <li>Identify over-irrigation periods (applied water exceeds ET + 20%)</li>
            <li>Spot under-irrigation stress periods (ET exceeds applied water)</li>
            <li>Overlay rainfall to see natural vs. supplemental water</li>
          </ul>
        </Subsection>

        <Subsection title="Task Completion Trends">
          <p>
            Monitor team productivity over season:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Weekly completion rate percentage</li>
            <li>Identify busy periods (harvest, pruning season)</li>
            <li>Spot slowdowns indicating understaffing</li>
            <li>Compare actual vs. planned labor hours</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Block Comparison">
        <Subsection title="Yield by Block">
          <p>
            Bar chart comparing tons per acre across all blocks:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Ranked from highest to lowest yield</li>
            <li>Color-coded by variety</li>
            <li>Shows percentage above/below vineyard average</li>
            <li>Hover to see: yield, Brix, tons, revenue estimate</li>
          </ul>
        </Subsection>

        <Subsection title="Quality Metrics">
          <p>
            Compare maturity and quality parameters across blocks:
          </p>
          <Table
            headers={["Block", "Tons/Acre", "Avg Brix", "Avg pH", "Quality Tier"]}
            rows={[
              ["Block A", "3.2", "25.1", "3.45", "Premium"],
              ["Block B", "4.1", "23.8", "3.62", "Standard"],
              ["Block C", "2.8", "26.3", "3.38", "Reserve"],
            ]}
          />
          <p className="text-sm text-gray-600 mt-3">
            Use quality tiers to justify differential pricing or lot separation for estate bottling.
          </p>
        </Subsection>

        <Subsection title="Water Use by Block">
          <p>
            Compare irrigation efficiency across blocks:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Gallons applied per acre</li>
            <li>Gallons per ton produced (water efficiency)</li>
            <li>Deficit stress days (soil moisture below 40%)</li>
            <li>Identify over/under-watered blocks for adjustment</li>
          </ul>
        </Subsection>

        <Subsection title="Cost per Acre">
          <p>
            Financial performance comparison:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Total operating cost per acre (labor + materials)</li>
            <li>Revenue per acre (yield × price)</li>
            <li>Profit margin by block</li>
            <li>ROI ranking (highest profit blocks)</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Visualizations">
        <Subsection title="Heat Maps">
          <p>
            Color-coded grid showing metrics across blocks and time:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Yield Heat Map:</strong> Rows = blocks, Columns = years, Color = tons/acre</li>
            <li><strong>Water Deficit Heat Map:</strong> Shows stress days by block and week</li>
            <li><strong>Task Completion Heat Map:</strong> Completion rate by crew and week</li>
          </ul>
        </Subsection>

        <Subsection title="Scatter Plots">
          <p>
            Explore correlations between variables:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Yield vs. Water:</strong> Does more irrigation increase yield?</li>
            <li><strong>Brix vs. Yield:</strong> Quality-quantity trade-off visualization</li>
            <li><strong>Age vs. Yield:</strong> Identify declining old blocks</li>
            <li><strong>Soil pH vs. Yield:</strong> Spot nutrient deficiency patterns</li>
          </ul>
        </Subsection>

        <Subsection title="Time Series Charts">
          <p>
            Line graphs showing metrics over time:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Multi-line charts comparing blocks side-by-side</li>
            <li>Zoom into specific date ranges</li>
            <li>Overlay weather data (temperature, rainfall)</li>
            <li>Export chart as image for reports</li>
          </ul>
        </Subsection>

        <Subsection title="Distribution Charts">
          <p>
            See spread and outliers in vineyard data:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Yield Distribution:</strong> Histogram showing how many blocks at each yield level</li>
            <li><strong>Brix Distribution:</strong> Bell curve of harvest sugar levels</li>
            <li><strong>Box Plots:</strong> Median, quartiles, outliers for any metric</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Custom Reports">
        <Subsection title="Report Builder">
          <p>
            Create custom reports with drag-and-drop widgets:
          </p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Click "New Report"</li>
            <li>Select metrics to include (KPIs, charts, tables)</li>
            <li>Arrange layout with drag-and-drop</li>
            <li>Filter by date range, blocks, or variety</li>
            <li>Save report template for reuse</li>
          </ol>
        </Subsection>

        <Subsection title="Automated Reporting">
          <p>
            Schedule reports to generate and email automatically:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Weekly Summary:</strong> Email every Monday with past week's activity</li>
            <li><strong>Monthly Performance:</strong> End-of-month KPI rollup</li>
            <li><strong>Harvest Dashboard:</strong> Daily updates during picking season</li>
            <li><strong>Custom Schedule:</strong> Set any frequency (daily, biweekly, etc.)</li>
          </ul>
        </Subsection>

        <Subsection title="Export Options">
          <p>
            Download data for external analysis:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>PDF:</strong> Print-friendly formatted reports</li>
            <li><strong>CSV:</strong> Raw data for Excel/Google Sheets</li>
            <li><strong>Excel:</strong> Pre-formatted workbook with charts</li>
            <li><strong>Image:</strong> Export individual charts as PNG</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Predictive Insights (Coming Soon)">
        <Subsection title="Yield Forecasting">
          <p>
            Machine learning models to predict harvest outcomes:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Predict final yield based on early-season berry samples</li>
            <li>Factor in historical trends and weather forecasts</li>
            <li>Confidence intervals (e.g., "2.8-3.4 tons/acre, 80% confidence")</li>
            <li>Update predictions weekly as new data arrives</li>
          </ul>
        </Subsection>

        <Subsection title="Irrigation Recommendations">
          <p>
            AI-powered irrigation scheduling suggestions:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Analyze historical yield vs. water use patterns</li>
            <li>Recommend optimal irrigation timing for quality/quantity balance</li>
            <li>Identify blocks where reduced irrigation improves fruit quality</li>
            <li>Predict stress thresholds for deficit irrigation strategies</li>
          </ul>
        </Subsection>

        <Subsection title="Disease Risk Modeling">
          <p>
            Forecast disease pressure based on weather and history:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Powdery mildew risk score from temperature/humidity</li>
            <li>Botrytis pressure forecast during late-season rain</li>
            <li>Recommend spray timing to prevent outbreaks</li>
            <li>Track actual disease incidence to refine models</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Best Practices">
        <Subsection title="Review Analytics Weekly">
          <p>
            Make data review part of your weekly routine:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Monday: Check KPIs, review past week's task completion</li>
            <li>Wednesday: Review irrigation efficiency, adjust schedules</li>
            <li>Friday: Update harvest projections, plan next week's picks</li>
          </ul>
        </Subsection>

        <Subsection title="Benchmark Against History">
          <p>
            Compare current season to past performance:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Is current water use on track with 5-year average?</li>
            <li>Are we ahead or behind on Brix accumulation?</li>
            <li>How does task completion compare to last year?</li>
          </ul>
        </Subsection>

        <Subsection title="Act on Outliers">
          <p>
            Use analytics to identify problems early:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Block with 30% lower yield → investigate soil, irrigation, pests</li>
            <li>Consistently overdue tasks → reassess crew capacity or scheduling</li>
            <li>High water use without yield increase → check for leaks or drainage issues</li>
          </ul>
        </Subsection>

        <Subsection title="Share Insights with Team">
          <p>
            Use visualizations to communicate with crew and stakeholders:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Show yield comparison to motivate crew (recognition for high performers)</li>
            <li>Share water savings data to reinforce conservation efforts</li>
            <li>Present quality trends to justify premium pricing to buyers</li>
          </ul>
        </Subsection>
      </Section>

      <Callout type="success" title="Data-Driven Decision Making">
        Vineyards using analytics to guide irrigation, harvest timing, and labor allocation see 10-20% improvement in profitability within 2-3 seasons. The insights are only valuable if you act on them—review data regularly and adjust operations based on trends.
      </Callout>

      <NextSteps
        links={[
          {
            title: "Field Management",
            description: "Track field-level yield and quality data",
            href: "/docs/operations/blocks",
          },
          {
            title: "Irrigation Management",
            description: "Monitor water use efficiency and ET trends",
            href: "/docs/operations/irrigation",
          },
          {
            title: "Task Management",
            description: "Analyze task completion rates and productivity",
            href: "/docs/operations/tasks",
          },
        ]}
      />
    </DocsLayout>
  );
}
