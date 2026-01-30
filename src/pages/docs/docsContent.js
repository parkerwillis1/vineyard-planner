/**
 * Documentation Content for Trellis
 * Each page has comprehensive documentation on how to use it
 */

export const docsContent = {
  // ============================================================================
  // PLANNER TOOL DOCUMENTATION
  // ============================================================================

  'planner/vineyard-design': {
    title: 'Vineyard Design',
    tool: 'Planner',
    description: 'Learn how to design your vineyard layout using the interactive map and auto-layout calculator.',
    sections: [
      {
        title: 'Overview',
        content: `The Vineyard Design tab is where you configure the physical layout of your vineyard. This is the foundation for all financial calculations and planning in Trellis.

Here you can:
- Set your total vineyard acreage
- Configure row spacing and vine spacing
- Choose trellis system type
- Define headland and row-end spacing
- See real-time calculations of total vines, rows, and plantable area`
      },
      {
        title: 'Getting Started',
        content: `1. **Enter Total Acreage**: Start by entering the total land area you have available for your vineyard. This should be the gross acreage before accounting for roads, buildings, or non-plantable areas.

2. **Set Row Spacing**: Choose the distance between your vine rows. Common spacings range from 6-12 feet depending on your equipment and trellis system. Wider spacing allows for larger equipment but reduces vine density.

3. **Set Vine Spacing**: Define the distance between vines within each row. Typical spacing is 4-8 feet. Closer spacing increases vine count but requires more labor and materials.

[PICTURE NEEDED: Screenshot of the vineyard configuration form with labeled fields]`
      },
      {
        title: 'Trellis System Selection',
        content: `Trellis provides several pre-configured trellis systems:

- **VSP (Vertical Shoot Positioning)**: Most common for premium wine grapes. Shoots are trained upward between catch wires.
- **High Wire/Top Wire**: Simple single-wire system, good for vigorous varieties.
- **Geneva Double Curtain (GDC)**: High-production system with two hanging curtains.
- **Scott Henry**: Divided canopy with shoots trained both up and down.
- **Smart-Dyson**: Ballerina-style training for high vigor sites.

Each system has different material requirements and labor needs, which are automatically calculated in the Financial Inputs.

[PICTURE NEEDED: Diagram showing different trellis system types]`
      },
      {
        title: 'Layout Calculator',
        content: `The auto-layout calculator determines:

- **Net Plantable Acres**: Total acreage minus headlands and turn rows
- **Total Rows**: Number of vine rows that fit in your layout
- **Vines Per Row**: Based on row length and vine spacing
- **Total Vines**: Complete vine count for ordering and budgeting

The calculator accounts for:
- Headland space at field ends (typically 20-30 feet for equipment turns)
- Row-end spacing for post placement
- Alleyways if your field is divided into blocks

[PICTURE NEEDED: Visual representation of the layout calculation showing headlands and row spacing]`
      },
      {
        title: 'Tips for Optimal Design',
        content: `**Row Orientation**: North-south rows typically provide the best sun exposure in most regions. East-west rows may be preferred on steep slopes.

**Equipment Compatibility**: Ensure your row spacing accommodates your largest piece of equipment plus a safety margin.

**Future Planning**: Consider leaving space for potential expansion or variety changes.

**Drainage**: Your physical layout should account for natural drainage patterns to prevent water pooling.`
      }
    ],
    relatedDocs: ['planner/financial-inputs', 'planner/vineyard-setup']
  },

  'planner/financial-inputs': {
    title: 'Financial Inputs',
    tool: 'Planner',
    description: 'Configure all cost parameters for accurate vineyard financial projections.',
    sections: [
      {
        title: 'Overview',
        content: `The Financial Inputs tab is where you enter all cost-related data for your vineyard project. Accurate inputs here are crucial for realistic financial projections.

This section covers:
- Material costs (posts, wire, vines, etc.)
- Labor rates and requirements
- Equipment costs
- Operating expenses
- Revenue assumptions`
      },
      {
        title: 'Material Costs',
        content: `Enter unit costs for all vineyard materials:

**Trellis Materials:**
- End posts (typically $15-40 each)
- Line posts ($3-15 each)
- Wire (per foot or per roll)
- Anchors and hardware

**Vine Materials:**
- Grapevines (varies by variety and rootstock, $3-15 each)
- Grow tubes
- Vine stakes

Trellis automatically calculates total material needs based on your vineyard design.

[PICTURE NEEDED: Screenshot of material costs input section]`
      },
      {
        title: 'Labor Costs',
        content: `Configure labor rates and time estimates:

**Hourly Rates:**
- General vineyard labor
- Skilled labor (pruning, training)
- Management/supervision

**Task Time Estimates:**
- Hours per acre for planting
- Hours per vine for training
- Seasonal labor requirements

The system uses industry benchmarks as defaults, but you should adjust based on your local labor market.

[PICTURE NEEDED: Labor cost configuration panel]`
      },
      {
        title: 'Operating Expenses',
        content: `Annual operating costs include:

- **Crop inputs**: Fertilizers, pesticides, herbicides
- **Irrigation**: Water costs, system maintenance
- **Equipment**: Fuel, maintenance, repairs
- **Insurance**: Crop insurance, liability
- **Overhead**: Management, office, utilities

These costs scale with vineyard size and production level.`
      },
      {
        title: 'Revenue Assumptions',
        content: `Project your vineyard income:

**Yield Projections:**
- Tons per acre at maturity (typically 3-6 tons for premium wine grapes)
- Ramp-up schedule (Year 1: 0, Year 2: 25%, Year 3: 50%, Year 4+: 100%)

**Price Per Ton:**
- Current market prices for your varieties
- Premium/discount factors for quality
- Contract vs. spot market assumptions

[PICTURE NEEDED: Revenue assumption inputs with yield curve preview]`
      }
    ],
    relatedDocs: ['planner/vineyard-design', 'planner/10-year-plan']
  },

  'planner/vineyard-setup': {
    title: 'Vineyard Setup',
    tool: 'Planner',
    description: 'Plan your vineyard establishment phase including site preparation and planting costs.',
    sections: [
      {
        title: 'Overview',
        content: `The Vineyard Setup tab helps you plan and budget for the establishment phase of your vineyard - the period from bare land to productive vines.

This typically spans 3-4 years and includes:
- Site preparation
- Trellis installation
- Planting
- Initial training and maintenance`
      },
      {
        title: 'Site Preparation',
        content: `Before planting, most sites require preparation:

**Land Clearing:**
- Removing existing vegetation
- Stump removal if previously forested
- Rock picking

**Soil Preparation:**
- Deep ripping to break hardpan
- Amendments (lime, gypsum, organic matter)
- Final grading and leveling

**Infrastructure:**
- Road construction
- Irrigation main lines
- Drainage installation

[PICTURE NEEDED: Site preparation cost breakdown chart]`
      },
      {
        title: 'Trellis Installation Timeline',
        content: `Trellis installation typically follows this sequence:

**Year 0 (Pre-Plant):**
1. Survey and mark row locations
2. Install end posts and anchors
3. Set line posts
4. String bottom wire

**Year 1 (Post-Plant):**
5. Install remaining wires as vines grow
6. Add catch wires for VSP systems

**Year 2-3:**
7. Final wire adjustments
8. Replace any failed posts

The system calculates labor and materials for each phase.`
      },
      {
        title: 'Planting Schedule',
        content: `Planting typically occurs in spring (March-May in Northern Hemisphere):

**Pre-Planting:**
- Order vines 12-18 months ahead
- Verify variety and rootstock availability
- Arrange cold storage if needed

**Planting Day:**
- Receive and inspect vines
- Soak roots before planting
- Plant at correct depth
- Install grow tubes

**Post-Planting:**
- Initial irrigation
- Weed control
- Pest monitoring

[PICTURE NEEDED: Planting timeline Gantt chart]`
      },
      {
        title: 'First-Year Care',
        content: `Critical tasks in Year 1:

- **Irrigation**: Frequent, light watering to establish roots
- **Weed Control**: Keep vine row weed-free
- **Pest Management**: Scout for deer, rodents, insects
- **Training**: Begin shaping vines to trellis system
- **Shoot Thinning**: Remove excess growth to focus energy

The system includes these costs in your establishment budget.`
      }
    ],
    relatedDocs: ['planner/vineyard-design', 'planner/financial-inputs']
  },

  'planner/10-year-plan': {
    title: '10-Year Financial Plan',
    tool: 'Planner',
    description: 'View comprehensive multi-year financial projections for your vineyard investment.',
    sections: [
      {
        title: 'Overview',
        content: `The 10-Year Plan tab presents a complete financial model of your vineyard project from establishment through mature production.

Key outputs include:
- Year-by-year cash flows
- Cumulative investment tracking
- Break-even analysis
- ROI calculations
- Net present value (NPV)`
      },
      {
        title: 'Understanding the Projections',
        content: `The financial model shows:

**Revenue:**
- Grape sales based on yield curve and prices
- Any additional income (agritourism, etc.)

**Expenses:**
- Establishment costs (Years 1-3)
- Annual operating costs
- Debt service if financing

**Cash Flow:**
- Net cash flow per year
- Cumulative cash position

[PICTURE NEEDED: 10-year projection table with key metrics highlighted]`
      },
      {
        title: 'Break-Even Analysis',
        content: `The model calculates when your vineyard becomes profitable:

**Cash Break-Even**: When annual revenue exceeds annual costs
**Investment Recovery**: When cumulative cash flow turns positive

Typical vineyards reach:
- Cash break-even: Years 4-5
- Investment recovery: Years 7-10

Your actual timeline depends on establishment costs, yields, and grape prices.

[PICTURE NEEDED: Break-even chart showing cumulative cash flow crossing zero]`
      },
      {
        title: 'Sensitivity Analysis',
        content: `The model helps you understand risk by showing how changes affect outcomes:

**Key Variables:**
- Grape price: +/- 20% impact
- Yield: +/- 30% impact
- Labor costs: +/- 15% impact

Use the scenario tools to test:
- Best case assumptions
- Worst case assumptions
- Most likely scenario

[PICTURE NEEDED: Sensitivity analysis tornado chart]`
      },
      {
        title: 'Using the Projections',
        content: `The 10-Year Plan is valuable for:

**Financing:**
- Bank loan applications
- Investor presentations
- Grant applications

**Planning:**
- Equipment purchase timing
- Labor hiring decisions
- Cash reserve requirements

**Decision Making:**
- Go/no-go on vineyard project
- Comparing variety options
- Evaluating expansion

Export the projections as PDF for sharing with stakeholders.`
      }
    ],
    relatedDocs: ['planner/financial-inputs', 'planner/business-plan']
  },

  'planner/business-plan': {
    title: 'Business Plan Report',
    tool: 'Planner',
    description: 'Generate a comprehensive business plan document for your vineyard project.',
    sections: [
      {
        title: 'Overview',
        content: `The Business Plan tab generates a professional, exportable business plan document based on all the data you've entered in the Planner.

This document is suitable for:
- Bank loan applications
- Investor pitches
- Grant applications
- Personal planning reference`
      },
      {
        title: 'Report Sections',
        content: `The generated business plan includes:

**Executive Summary:**
- Project overview
- Key financial metrics
- Investment highlights

**Vineyard Specifications:**
- Acreage and layout
- Varieties and rootstocks
- Trellis system details

**Market Analysis:**
- Target market for grapes
- Pricing assumptions
- Competition overview

**Financial Projections:**
- 10-year pro forma
- Cash flow analysis
- Return on investment

[PICTURE NEEDED: Business plan report preview showing table of contents]`
      },
      {
        title: 'Customizing the Report',
        content: `Before exporting, you can customize:

**Company Information:**
- Business name and logo
- Contact information
- Business structure (LLC, etc.)

**Narrative Sections:**
- Mission statement
- Management team bios
- Location description

**Appendices:**
- Additional supporting documents
- Maps and photos
- Letters of intent`
      },
      {
        title: 'Exporting Options',
        content: `Export your business plan in multiple formats:

- **PDF**: Professional format for printing and sharing
- **Word**: Editable format for further customization
- **Print**: Direct printing with optimized formatting

The exported document includes all charts and tables formatted for professional presentation.`
      }
    ],
    relatedDocs: ['planner/10-year-plan', 'planner/financial-inputs']
  },

  // ============================================================================
  // OPERATIONS TOOL DOCUMENTATION
  // ============================================================================

  'operations/my-vineyard': {
    title: 'My Vineyard',
    tool: 'Operations',
    description: 'Manage your vineyard profile, team members, and organization settings.',
    sections: [
      {
        title: 'Overview',
        content: `My Vineyard is your central hub for managing your vineyard organization in Trellis. Here you configure your vineyard profile and manage team access.

Key features:
- Vineyard profile and branding
- Team member management
- Role-based permissions
- Organization settings`
      },
      {
        title: 'Vineyard Profile',
        content: `Set up your vineyard identity:

**Basic Information:**
- Vineyard name
- Location and address
- Contact information
- Website and social links

**Branding:**
- Upload your logo
- Set brand colors
- Configure report headers

This information appears on reports and shared documents.

[PICTURE NEEDED: Vineyard profile settings form]`
      },
      {
        title: 'Team Management',
        content: `Add and manage team members:

**Inviting Members:**
1. Click "Invite Team Member"
2. Enter their email address
3. Select their role
4. Send invitation

**Roles:**
- **Owner**: Full access to all features and billing
- **Manager**: Can manage operations but not billing
- **Worker**: Limited to assigned tasks and data entry
- **Viewer**: Read-only access to reports

[PICTURE NEEDED: Team management interface with role selector]`
      },
      {
        title: 'Permissions',
        content: `Control what each role can access:

| Feature | Owner | Manager | Worker | Viewer |
|---------|-------|---------|--------|--------|
| View Data | ✓ | ✓ | ✓ | ✓ |
| Edit Data | ✓ | ✓ | ✓ | - |
| Delete Data | ✓ | ✓ | - | - |
| Manage Team | ✓ | - | - | - |
| Billing | ✓ | - | - | - |

Custom permissions can be configured for specific needs.`
      }
    ],
    relatedDocs: ['operations/dashboard', 'account/settings']
  },

  'operations/dashboard': {
    title: 'Operations Dashboard',
    tool: 'Operations',
    description: 'Get a real-time overview of your vineyard operations and key metrics.',
    sections: [
      {
        title: 'Overview',
        content: `The Operations Dashboard provides an at-a-glance view of everything happening in your vineyard. It's designed to be your first stop each day to understand current status and priorities.

Key widgets:
- Active tasks and upcoming deadlines
- Weather conditions and alerts
- Field status summary
- Recent activity feed`
      },
      {
        title: 'Quick Stats',
        content: `The top of the dashboard shows key metrics:

**Vineyard Overview:**
- Total acreage under management
- Number of active blocks
- Current growth stage
- Days until next milestone

**Task Summary:**
- Tasks due today
- Overdue tasks
- Tasks completed this week

[PICTURE NEEDED: Dashboard header with quick stats widgets]`
      },
      {
        title: 'Weather Widget',
        content: `Real-time weather information:

**Current Conditions:**
- Temperature and humidity
- Wind speed and direction
- Precipitation status

**Forecast:**
- 7-day outlook
- Spray window recommendations
- Frost alerts

**Alerts:**
- Disease pressure warnings
- Irrigation recommendations
- Heat stress notifications

[PICTURE NEEDED: Weather widget showing current conditions and forecast]`
      },
      {
        title: 'Activity Feed',
        content: `Track recent vineyard activity:

- Task completions by team members
- Data entries and updates
- System alerts and notifications
- Equipment status changes

Filter by:
- Time period
- Activity type
- Team member
- Field/block`
      },
      {
        title: 'Customizing Your Dashboard',
        content: `Arrange widgets to suit your workflow:

- Drag and drop to reorder
- Collapse widgets you don't need
- Set default view preferences
- Create saved layouts

Your dashboard layout syncs across devices.`
      }
    ],
    relatedDocs: ['operations/weather', 'operations/tasks', 'operations/calendar']
  },

  'operations/calendar': {
    title: 'Calendar',
    tool: 'Operations',
    description: 'View and manage all vineyard activities in a calendar format.',
    sections: [
      {
        title: 'Overview',
        content: `The Calendar view displays all your vineyard activities, tasks, and events in a familiar calendar format. Plan your season, track progress, and coordinate team activities.

Features:
- Multiple calendar views (day, week, month)
- Task scheduling and deadlines
- Event creation and management
- Team availability tracking`
      },
      {
        title: 'Calendar Views',
        content: `Switch between views to see your schedule:

**Month View:**
- Overview of the entire month
- See task counts per day
- Identify busy periods

**Week View:**
- Detailed daily breakdown
- Time-block scheduling
- Better for planning

**Day View:**
- Hour-by-hour detail
- Task sequencing
- Resource allocation

[PICTURE NEEDED: Calendar in month view showing tasks and events]`
      },
      {
        title: 'Creating Events',
        content: `Add activities to your calendar:

1. Click on a date or time slot
2. Select event type:
   - Task (linked to task management)
   - Event (meetings, inspections)
   - Reminder (personal notes)
3. Fill in details:
   - Title and description
   - Start and end time
   - Assigned team members
   - Location/field
4. Set recurrence if needed
5. Save

[PICTURE NEEDED: Event creation modal with all fields]`
      },
      {
        title: 'Task Integration',
        content: `Calendar integrates with Task Management:

- Tasks with due dates appear automatically
- Drag tasks to reschedule
- Click tasks to see details
- Mark complete from calendar

Color coding shows:
- Green: Completed
- Yellow: Due soon
- Red: Overdue
- Blue: Future tasks`
      },
      {
        title: 'Sharing and Export',
        content: `Share your calendar:

- **Team Sharing**: All team members see relevant events
- **iCal Export**: Sync with Google Calendar, Outlook, Apple Calendar
- **Print**: Generate printable schedules
- **Reports**: Weekly/monthly activity summaries`
      }
    ],
    relatedDocs: ['operations/tasks', 'operations/dashboard']
  },

  'operations/weather': {
    title: 'Weather Dashboard',
    tool: 'Operations',
    description: 'Monitor real-time weather conditions and get vineyard-specific insights.',
    sections: [
      {
        title: 'Overview',
        content: `The Weather Dashboard provides comprehensive weather monitoring tailored specifically for vineyard operations. Get current conditions, forecasts, and actionable insights for spray timing, irrigation, and disease management.

Data sources:
- National Weather Service (NWS)
- Field-specific weather stations (if configured)
- Historical weather patterns`
      },
      {
        title: 'Current Conditions',
        content: `View real-time weather for your vineyard location:

**Measurements:**
- Temperature (current, high, low)
- Humidity
- Wind speed and direction
- Barometric pressure
- Precipitation

**Field Selection:**
- Choose which field to monitor
- See conditions at field's exact location
- Compare across multiple fields

[PICTURE NEEDED: Current conditions panel with all measurements]`
      },
      {
        title: '7-Day Forecast',
        content: `Plan ahead with detailed forecasts:

**Daily Forecasts:**
- High/low temperatures
- Precipitation probability
- Wind conditions
- Weather description

**Planning Features:**
- Identify spray windows
- Schedule outdoor tasks
- Plan harvest timing

[PICTURE NEEDED: 7-day forecast cards with icons]`
      },
      {
        title: 'Vineyard Weather Insights',
        content: `Automated analysis for vineyard decisions:

**Spray Conditions:**
- Wind speed suitability
- Rain probability impact
- Recommended spray windows

**Irrigation Needs:**
- Recent rainfall totals
- Evapotranspiration estimates
- Irrigation recommendations

**Disease Pressure:**
- Temperature/humidity analysis
- Mildew risk assessment
- Botrytis conditions

**Harvest Window:**
- Rain-free periods
- Temperature forecasts
- Optimal harvest timing

[PICTURE NEEDED: Vineyard insights cards showing status indicators]`
      },
      {
        title: 'Historical Data',
        content: `Review past weather:

**Rainfall History:**
- Last 7 days precipitation
- Monthly totals
- Comparison to averages

**Growing Degree Days:**
- Accumulated GDD
- Comparison to previous years
- Phenological predictions

Use historical data to:
- Validate spray records
- Explain yield variations
- Plan for next season`
      }
    ],
    relatedDocs: ['operations/spray-records', 'operations/irrigation', 'operations/dashboard']
  },

  'operations/fields': {
    title: 'Fields (Blocks)',
    tool: 'Operations',
    description: 'Manage your vineyard blocks, view maps, and track field-specific data.',
    sections: [
      {
        title: 'Overview',
        content: `The Fields page (also called Blocks) is where you manage the individual vineyard blocks that make up your property. Each block can have its own variety, rootstock, planting date, and management practices.

Features:
- Block mapping and boundaries
- Variety and rootstock tracking
- Block-specific data recording
- Performance comparison`
      },
      {
        title: 'Adding a New Block',
        content: `Create a new vineyard block:

1. Click "Add Block" button
2. Enter basic information:
   - Block name/number
   - Acreage
   - Variety
   - Rootstock
   - Plant year
3. Draw or upload boundaries:
   - Use the map tool to draw
   - Upload GeoJSON or shapefile
   - Enter coordinates manually
4. Add additional details:
   - Row orientation
   - Trellis system
   - Irrigation type
5. Save the block

[PICTURE NEEDED: Add block form with map drawing tool]`
      },
      {
        title: 'Block Map',
        content: `Visualize your vineyard:

**Map Features:**
- Satellite/aerial imagery background
- Block boundaries overlay
- Color coding by variety or status
- Measurement tools

**Interactions:**
- Click blocks for details
- Zoom and pan navigation
- Toggle layer visibility
- Export map images

[PICTURE NEEDED: Vineyard map showing multiple blocks with different colors]`
      },
      {
        title: 'Block Details',
        content: `Click any block to view its details:

**Field Info Tab:**
- Basic block information
- Variety and rootstock details
- Planting specifications
- Current status

**Map Tab:**
- Block boundary close-up
- Row layout visualization
- GPS coordinates

**Field Samples Tab:**
- Berry sampling data
- Brix, pH, TA readings
- Sample history

**Photos Tab:**
- Field photos over time
- Geotagged images
- Visual record keeping

**Yield History Tab:**
- Historical yields
- Year-over-year comparison
- Quality metrics

[PICTURE NEEDED: Block detail page showing tabbed interface]`
      },
      {
        title: 'Field Management Tips',
        content: `Best practices for block organization:

**Naming Convention:**
- Use consistent naming (e.g., "A1", "A2", "B1")
- Include variety abbreviation if helpful
- Keep names short for labels

**Grouping:**
- Group by location
- Group by variety
- Group by management practice

**Record Keeping:**
- Update block status regularly
- Record all activities by block
- Take photos throughout the season`
      }
    ],
    relatedDocs: ['operations/tasks', 'operations/harvest', 'operations/irrigation']
  },

  'operations/tasks': {
    title: 'Task Management',
    tool: 'Operations',
    description: 'Create, assign, and track vineyard tasks and work orders.',
    sections: [
      {
        title: 'Overview',
        content: `Task Management helps you organize all the work that needs to happen in your vineyard. Create tasks, assign them to team members, set due dates, and track completion.

Task types:
- Scheduled maintenance
- Seasonal operations
- Ad-hoc work orders
- Recurring tasks`
      },
      {
        title: 'Creating Tasks',
        content: `Add a new task:

1. Click "New Task" button
2. Fill in task details:
   - **Title**: Brief description
   - **Description**: Detailed instructions
   - **Type**: Category of work
   - **Priority**: Low, Medium, High, Urgent
   - **Due Date**: When it needs completion
   - **Assignee**: Team member(s) responsible
   - **Block**: Which field(s) affected
   - **Estimated Time**: Hours expected
3. Attach files if needed (photos, documents)
4. Save task

[PICTURE NEEDED: New task creation form]`
      },
      {
        title: 'Task Views',
        content: `View tasks in different formats:

**List View:**
- All tasks in a sortable table
- Filter by status, assignee, block
- Bulk actions available

**Kanban Board:**
- Visual columns by status
- Drag tasks between columns
- Quick status updates

**Calendar View:**
- Tasks on calendar dates
- See workload distribution
- Plan capacity

[PICTURE NEEDED: Kanban board showing task columns]`
      },
      {
        title: 'Completing Tasks',
        content: `When work is done:

1. Open the task
2. Click "Mark Complete" or drag to Done column
3. Add completion notes:
   - Actual time spent
   - Materials used
   - Issues encountered
   - Photos of completed work
4. Task moves to completed status

Completed tasks remain searchable for records and reporting.`
      },
      {
        title: 'Recurring Tasks',
        content: `Set up tasks that repeat:

**Recurrence Options:**
- Daily, Weekly, Monthly, Yearly
- Custom intervals
- Specific days of week/month

**Examples:**
- Weekly mowing schedule
- Monthly equipment inspection
- Annual pruning reminders

The system automatically creates new task instances based on your schedule.`
      }
    ],
    relatedDocs: ['operations/calendar', 'operations/labor', 'operations/fields']
  },

  'operations/irrigation': {
    title: 'Irrigation Management',
    tool: 'Operations',
    description: 'Monitor and manage vineyard irrigation with NDVI-based zone mapping.',
    sections: [
      {
        title: 'Overview',
        content: `Irrigation Management combines traditional irrigation scheduling with advanced satellite-based vegetation monitoring. Use NDVI (Normalized Difference Vegetation Index) data to create variable rate irrigation zones and optimize water usage.

Features:
- Satellite NDVI imagery
- Variable rate irrigation zones
- Schedule management
- Water usage tracking`
      },
      {
        title: 'NDVI Zone Mapping',
        content: `Fetch satellite imagery to analyze vine vigor:

1. Select a vineyard block
2. Click "Fetch NDVI Data"
3. System retrieves Sentinel-2 satellite imagery
4. NDVI values are calculated and displayed
5. Zones are automatically created based on vigor levels

**Understanding NDVI:**
- Higher NDVI (green) = More vigorous growth
- Lower NDVI (red/yellow) = Less vigorous or stressed
- Use zones to target irrigation where needed most

[PICTURE NEEDED: NDVI zone map with legend showing vigor levels]`
      },
      {
        title: 'Irrigation Zones',
        content: `Create variable rate irrigation zones:

**Automatic Zones:**
Based on NDVI data, zones are created:
- Low vigor (needs more water)
- Medium vigor (standard application)
- High vigor (reduce water to control growth)

**Zone Details:**
- Acreage of each zone
- Recommended irrigation rate
- Application adjustments

**Manual Zones:**
You can also create custom zones:
- Draw zone boundaries
- Set application rates
- Name and describe zones

[PICTURE NEEDED: Zone list with irrigation rates and acreage]`
      },
      {
        title: 'Irrigation Scheduling',
        content: `Plan your irrigation:

**Creating a Schedule:**
1. Select zones to irrigate
2. Set application amount (gallons or inches)
3. Choose date and time
4. Assign to team member or automation

**Schedule Options:**
- One-time irrigation event
- Recurring schedule
- Weather-based automation

**Tracking:**
- Log actual water applied
- Compare scheduled vs. actual
- Track seasonal totals

[PICTURE NEEDED: Irrigation schedule calendar]`
      },
      {
        title: 'Water Usage Reports',
        content: `Monitor water consumption:

**Reports Include:**
- Total water applied by block
- Application efficiency
- Cost per acre
- Seasonal comparisons

**Benefits:**
- Identify over/under watering
- Optimize water costs
- Meet regulatory requirements
- Improve sustainability`
      }
    ],
    relatedDocs: ['operations/fields', 'operations/weather', 'operations/tasks']
  },

  'operations/spray-records': {
    title: 'Spray Records',
    tool: 'Operations',
    description: 'Document and track all pesticide and spray applications.',
    sections: [
      {
        title: 'Overview',
        content: `Spray Records maintains a complete history of all chemical applications in your vineyard. This documentation is essential for regulatory compliance, certification programs, and integrated pest management.

Records include:
- Pesticide applications
- Fungicide treatments
- Herbicide usage
- Foliar nutrients`
      },
      {
        title: 'Recording an Application',
        content: `Document each spray application:

1. Click "New Spray Record"
2. Enter application details:
   - **Date/Time**: When applied
   - **Block(s)**: Which fields treated
   - **Product**: Chemical/product used
   - **Rate**: Application rate
   - **Total Applied**: Quantity used
   - **Target Pest**: What you're treating
   - **Method**: How applied (tractor, backpack, etc.)
   - **Applicator**: Who applied it
   - **Weather Conditions**: Temp, wind, humidity
   - **REI**: Re-entry interval
   - **PHI**: Pre-harvest interval
3. Upload label or SDS if needed
4. Save record

[PICTURE NEEDED: Spray record entry form with all fields]`
      },
      {
        title: 'Product Library',
        content: `Maintain a list of approved products:

**For Each Product:**
- Product name and manufacturer
- EPA registration number
- Active ingredients
- Label upload
- Default rates
- REI and PHI information

**Benefits:**
- Quick selection when recording
- Consistent rate tracking
- Easy compliance verification

[PICTURE NEEDED: Product library list with key details]`
      },
      {
        title: 'Compliance Features',
        content: `Stay compliant with regulations:

**Interval Tracking:**
- REI countdowns by block
- PHI harvest restrictions
- Automatic warnings

**Reports:**
- Annual application summary
- Product usage totals
- Block treatment history

**Certifications:**
- Organic program documentation
- Sustainability certifications
- Export market requirements`
      },
      {
        title: 'Weather Integration',
        content: `Weather conditions affect spray efficacy:

**Recorded Conditions:**
- Temperature at application
- Wind speed and direction
- Humidity level
- Recent/forecast rain

**Spray Window Alerts:**
- Avoid spraying in high winds
- Consider rain wash-off risk
- Optimal temperature ranges

The system can auto-fill weather from your location data.`
      }
    ],
    relatedDocs: ['operations/weather', 'operations/fields', 'operations/tasks']
  },

  'operations/harvest': {
    title: 'Harvest Tracking',
    tool: 'Operations',
    description: 'Plan and track grape harvest from field to delivery.',
    sections: [
      {
        title: 'Overview',
        content: `Harvest Tracking helps you manage the critical harvest period. Plan picking schedules, record harvest weights, track fruit quality, and document deliveries.

Features:
- Harvest planning tools
- Weight ticket recording
- Quality data entry
- Delivery tracking
- Yield analysis`
      },
      {
        title: 'Pre-Harvest Planning',
        content: `Prepare for harvest:

**Harvest Estimates:**
- Enter estimated yields by block
- Based on cluster counts and weights
- Compare to historical yields

**Scheduling:**
- Set target harvest dates by variety
- Coordinate picking crews
- Arrange transportation

**Equipment Prep:**
- Harvest bins/lugs
- Picking equipment
- Transport vehicles

[PICTURE NEEDED: Harvest planning calendar with estimated dates]`
      },
      {
        title: 'Recording Harvest',
        content: `Log harvest data as grapes come in:

1. Click "New Harvest Record"
2. Enter details:
   - **Date/Time**: When picked
   - **Block**: Source block
   - **Variety**: Grape variety
   - **Weight**: Total weight (tons/lbs)
   - **Bins/Lugs**: Container count
   - **Crew**: Who picked
   - **Quality Data**: Brix, pH, TA, etc.
3. Record destination:
   - On-site winery
   - External buyer
   - Storage
4. Save record

[PICTURE NEEDED: Harvest record entry form]`
      },
      {
        title: 'Quality Tracking',
        content: `Monitor fruit quality at harvest:

**Field Measurements:**
- Brix (sugar content)
- pH level
- Titratable acidity
- Berry weight

**Visual Assessment:**
- Rot/damage percentage
- Color development
- Overall condition

**Trends:**
- Track quality by block
- Compare to previous vintages
- Identify quality patterns

[PICTURE NEEDED: Quality metrics chart comparing blocks]`
      },
      {
        title: 'Yield Analysis',
        content: `Analyze harvest results:

**Yield Reports:**
- Total tons harvested
- Yield per acre by block
- Comparison to estimates
- Historical comparison

**Value Analysis:**
- Revenue by block
- Price per ton achieved
- Premium/discount factors

**Planning Insights:**
- Identify top-performing blocks
- Flag underperforming areas
- Guide next year's planning`
      }
    ],
    relatedDocs: ['operations/fields', 'production/harvest-intake', 'operations/inventory']
  },

  'operations/inventory': {
    title: 'Inventory Management',
    tool: 'Operations',
    description: 'Track vineyard supplies, materials, and equipment inventory.',
    sections: [
      {
        title: 'Overview',
        content: `Inventory Management tracks all the supplies and materials used in your vineyard operation. Know what you have on hand, when to reorder, and how much you're spending.

Categories:
- Chemicals (pesticides, herbicides)
- Fertilizers and amendments
- Trellis materials
- Irrigation supplies
- Packaging materials
- Tools and equipment`
      },
      {
        title: 'Adding Inventory Items',
        content: `Track new items:

1. Click "Add Item"
2. Enter item details:
   - **Name**: Product name
   - **Category**: Type of item
   - **Unit**: How measured (gallons, lbs, each)
   - **Current Stock**: Quantity on hand
   - **Reorder Point**: When to alert for reorder
   - **Supplier**: Where you buy it
   - **Cost**: Unit price
   - **Location**: Where stored
3. Save item

[PICTURE NEEDED: Add inventory item form]`
      },
      {
        title: 'Tracking Usage',
        content: `Record when inventory is used:

**Automatic Tracking:**
- Spray records automatically deduct chemicals
- Task completions can deduct materials

**Manual Adjustments:**
- Add stock when received
- Remove stock when used
- Adjust for spoilage/damage

**Transaction History:**
- Every change is logged
- See who made changes
- Track usage patterns`
      },
      {
        title: 'Reorder Alerts',
        content: `Never run out of critical supplies:

**Reorder Points:**
- Set minimum stock levels
- Get alerts when stock is low
- Review items needing reorder

**Reports:**
- Items below reorder point
- Items expiring soon
- Usage rate analysis

[PICTURE NEEDED: Low stock alert list]`
      },
      {
        title: 'Cost Tracking',
        content: `Monitor inventory costs:

**Reports Include:**
- Total inventory value
- Cost by category
- Usage cost per acre
- Year-over-year comparison

**Budgeting:**
- Plan purchases
- Track spending vs. budget
- Identify cost-saving opportunities`
      }
    ],
    relatedDocs: ['operations/spray-records', 'operations/tasks', 'operations/equipment']
  },

  'operations/analytics': {
    title: 'Analytics (Cost Analysis)',
    tool: 'Operations',
    description: 'Analyze vineyard costs, performance, and profitability.',
    sections: [
      {
        title: 'Overview',
        content: `The Analytics page provides comprehensive cost analysis and performance metrics for your vineyard operation. Understand where your money goes and identify opportunities for improvement.

Key metrics:
- Cost per acre
- Cost per ton produced
- Labor efficiency
- Input costs breakdown`
      },
      {
        title: 'Cost Breakdown',
        content: `See where money is spent:

**Categories:**
- Labor costs
- Chemical/spray costs
- Fertilizer costs
- Equipment costs
- Irrigation costs
- Overhead costs

**Views:**
- By category (pie chart)
- By block (comparison)
- By month (trend)

[PICTURE NEEDED: Cost breakdown pie chart with categories]`
      },
      {
        title: 'Per-Unit Metrics',
        content: `Understand true costs:

**Cost Per Acre:**
- Total cost ÷ Total acres
- Compare blocks
- Benchmark against industry

**Cost Per Ton:**
- Total cost ÷ Tons produced
- Critical for pricing decisions
- Shows efficiency

[PICTURE NEEDED: Cost per acre and per ton trend chart]`
      },
      {
        title: 'Block Comparison',
        content: `Compare performance across blocks:

**Metrics:**
- Yield per acre
- Cost per acre
- Revenue per acre
- Profit margin

**Insights:**
- Identify best performers
- Find problem areas
- Guide replanting decisions

[PICTURE NEEDED: Block comparison table with key metrics]`
      },
      {
        title: 'Trend Analysis',
        content: `Track changes over time:

**Reports:**
- Year-over-year cost changes
- Seasonal spending patterns
- Multi-year performance trends

**Forecasting:**
- Project future costs
- Budget planning
- Investment decisions`
      }
    ],
    relatedDocs: ['operations/harvest', 'operations/labor', 'operations/inventory']
  },

  'operations/equipment': {
    title: 'Equipment Management',
    tool: 'Operations',
    description: 'Track vineyard equipment, maintenance schedules, and usage.',
    sections: [
      {
        title: 'Overview',
        content: `Equipment Management helps you track all machinery and tools used in your vineyard. Schedule maintenance, log usage, and track equipment costs.

Features:
- Equipment inventory
- Maintenance scheduling
- Usage logging
- Cost tracking`
      },
      {
        title: 'Equipment Inventory',
        content: `Track all your equipment:

**For Each Item:**
- Name and description
- Make/model/year
- Serial number
- Purchase date and cost
- Current status
- Location

**Categories:**
- Tractors
- Sprayers
- Mowers
- Harvest equipment
- Irrigation equipment
- Hand tools

[PICTURE NEEDED: Equipment list with status indicators]`
      },
      {
        title: 'Maintenance Scheduling',
        content: `Keep equipment running:

**Scheduled Maintenance:**
- Set service intervals (hours or date)
- Get reminders before due
- Track maintenance history

**Recording Maintenance:**
1. Select equipment
2. Enter service performed
3. Record cost and parts
4. Update hours/date
5. Set next service due

[PICTURE NEEDED: Maintenance schedule with upcoming items]`
      },
      {
        title: 'Usage Tracking',
        content: `Log equipment usage:

**Usage Records:**
- Date and duration
- Operator
- Task performed
- Hours added

**Benefits:**
- Know maintenance needs
- Track operating costs
- Plan replacements`
      },
      {
        title: 'Cost Analysis',
        content: `Understand equipment costs:

**Reports:**
- Total cost of ownership
- Cost per hour of operation
- Maintenance cost history
- Fuel costs

**Decisions:**
- Repair vs. replace
- Lease vs. buy
- Right-size equipment`
      }
    ],
    relatedDocs: ['operations/tasks', 'operations/analytics', 'operations/inventory']
  },

  'operations/labor': {
    title: 'Labor Tracking',
    tool: 'Operations',
    description: 'Track labor hours, costs, and team productivity.',
    sections: [
      {
        title: 'Overview',
        content: `Labor Tracking helps you manage your vineyard workforce. Record hours worked, track costs, and analyze productivity.

Features:
- Time tracking
- Payroll support
- Task-based labor allocation
- Productivity metrics`
      },
      {
        title: 'Recording Time',
        content: `Log labor hours:

**Time Entry:**
- Select worker
- Enter date and hours
- Choose task/activity type
- Assign to block if applicable
- Add notes

**Methods:**
- Manual entry by manager
- Worker self-entry (if enabled)
- Integration with time clocks

[PICTURE NEEDED: Time entry form]`
      },
      {
        title: 'Labor Categories',
        content: `Organize work by type:

**Common Categories:**
- Pruning
- Canopy management
- Spraying
- Mowing
- Irrigation
- Harvest
- General maintenance

**Benefits:**
- See where time goes
- Budget by activity
- Compare efficiency`
      },
      {
        title: 'Payroll Reports',
        content: `Generate payroll data:

**Reports:**
- Hours by worker
- Hours by period
- Overtime tracking
- Cost calculations

**Export:**
- To payroll systems
- To accounting software
- PDF summaries

[PICTURE NEEDED: Weekly labor summary report]`
      },
      {
        title: 'Productivity Analysis',
        content: `Measure efficiency:

**Metrics:**
- Hours per acre
- Cost per acre
- Task completion rates
- Worker comparisons

**Uses:**
- Identify training needs
- Optimize crew sizes
- Budget labor costs`
      }
    ],
    relatedDocs: ['operations/tasks', 'operations/analytics', 'operations/my-vineyard']
  },

  'operations/devices': {
    title: 'Devices (Hardware Integration)',
    tool: 'Operations',
    description: 'Connect and manage IoT sensors and hardware devices.',
    sections: [
      {
        title: 'Overview',
        content: `The Devices page lets you connect IoT sensors and hardware to Trellis for automated data collection. Monitor conditions in real-time and set up alerts.

Supported devices:
- Weather stations
- Soil moisture sensors
- Temperature sensors
- Flow meters`
      },
      {
        title: 'Connecting Devices',
        content: `Add a new device:

1. Click "Add Device"
2. Select device type
3. Enter device credentials:
   - API key or device ID
   - Connection URL
   - Authentication details
4. Configure settings:
   - Data sync frequency
   - Alert thresholds
   - Location assignment
5. Test connection
6. Save device

[PICTURE NEEDED: Device setup wizard]`
      },
      {
        title: 'Supported Integrations',
        content: `Devices currently supported:

**Weather Stations:**
- Davis Instruments
- Spectrum Technologies
- Generic via API

**Soil Sensors:**
- Sentek
- Irrometer
- Generic via API

**Other:**
- Flow meters
- Tank level sensors
- Custom webhooks

More integrations coming soon!`
      },
      {
        title: 'Viewing Data',
        content: `Monitor device readings:

**Dashboard Widgets:**
- Current readings
- Charts over time
- Status indicators

**Historical Data:**
- Download raw data
- Generate reports
- Trend analysis

[PICTURE NEEDED: Device dashboard with sensor readings]`
      },
      {
        title: 'Alerts',
        content: `Get notified of important conditions:

**Alert Types:**
- Threshold alerts (temp too high/low)
- Change alerts (sudden changes)
- Connection alerts (device offline)

**Notification Methods:**
- In-app notifications
- Email alerts
- SMS (premium feature)`
      }
    ],
    relatedDocs: ['operations/weather', 'operations/irrigation', 'production/sensors']
  },

  'operations/archived': {
    title: 'Archived Items',
    tool: 'Operations',
    description: 'View and restore archived blocks, tasks, and records.',
    sections: [
      {
        title: 'Overview',
        content: `The Archived Items page stores items you've removed from active use. Nothing is permanently deleted - everything can be restored if needed.

Archived items:
- Removed blocks
- Completed/cancelled tasks
- Old records`
      },
      {
        title: 'Viewing Archives',
        content: `Browse archived items:

**Filters:**
- By item type
- By archive date
- By original category

**Search:**
- Find specific items
- Full-text search
- Date range search

[PICTURE NEEDED: Archive list with filter options]`
      },
      {
        title: 'Restoring Items',
        content: `Bring items back:

1. Find the archived item
2. Click "Restore"
3. Confirm restoration
4. Item returns to active status

Restored items keep their original data and history.`
      },
      {
        title: 'Permanent Deletion',
        content: `If you need to permanently remove data:

**Important:**
- Permanent deletion cannot be undone
- Required for data privacy compliance
- Only owners can permanently delete

**Process:**
1. Archive the item first
2. Go to Archives
3. Select "Delete Permanently"
4. Confirm deletion`
      }
    ],
    relatedDocs: ['operations/fields', 'operations/tasks']
  },

  // ============================================================================
  // PRODUCTION TOOL DOCUMENTATION
  // ============================================================================

  'production/dashboard': {
    title: 'Production Dashboard',
    tool: 'Production',
    description: 'Overview of winery production status, active lots, and key metrics.',
    sections: [
      {
        title: 'Overview',
        content: `The Production Dashboard gives you a comprehensive view of your winery operations. See all active lots, fermentation status, vessel usage, and production metrics at a glance.

Key features:
- Active lot summary
- Vessel utilization
- Fermentation progress
- Recent activity`
      },
      {
        title: 'Active Lots Summary',
        content: `See all wine lots in production:

**Lot Cards Show:**
- Lot number and name
- Variety and vintage
- Current stage (fermenting, aging, etc.)
- Key metrics (Brix, temp, etc.)
- Days in current stage

**Quick Actions:**
- Click to view lot details
- Update status
- Add log entry

[PICTURE NEEDED: Dashboard with active lot cards]`
      },
      {
        title: 'Vessel Utilization',
        content: `Monitor tank and barrel usage:

**Metrics:**
- Total capacity
- Currently in use
- Available space
- Utilization percentage

**Visual:**
- Capacity chart
- Vessel status grid
- Upcoming availability

[PICTURE NEEDED: Vessel utilization chart]`
      },
      {
        title: 'Production Metrics',
        content: `Key performance indicators:

**Volume Metrics:**
- Total gallons in production
- Gallons by stage
- Expected final volume

**Quality Metrics:**
- Average metrics across lots
- Alert conditions
- Trend indicators

**Efficiency:**
- Throughput rates
- Turnaround times
- Loss percentages`
      }
    ],
    relatedDocs: ['production/fermentation', 'production/vessels', 'production/analytics']
  },

  'production/harvest-intake': {
    title: 'Harvest Intake',
    tool: 'Production',
    description: 'Receive and process incoming grape deliveries at the winery.',
    sections: [
      {
        title: 'Overview',
        content: `Harvest Intake manages the receiving of grapes at your winery. Create intake records, run quality checks, and assign fruit to production lots.

Features:
- Delivery receiving
- Quality testing
- Lot creation
- Weight tracking`
      },
      {
        title: 'Receiving Deliveries',
        content: `When grapes arrive:

1. Click "New Intake"
2. Record delivery details:
   - **Source**: Vineyard and block
   - **Variety**: Grape variety
   - **Weight**: Gross and tare weights
   - **Date/Time**: Arrival time
   - **Delivery**: Truck/bin info
3. Assign a lot number
4. Save intake record

[PICTURE NEEDED: Harvest intake form]`
      },
      {
        title: 'Quality Checks',
        content: `Test incoming fruit:

**Standard Tests:**
- Brix (sugar level)
- pH
- Titratable acidity (TA)
- Temperature

**Visual Assessment:**
- MOG (material other than grapes)
- Rot/damage percentage
- Overall quality grade

**Recording:**
- Enter results with intake
- Pass/fail thresholds
- Quality notes

[PICTURE NEEDED: Quality testing panel with results]`
      },
      {
        title: 'Creating Lots',
        content: `Organize fruit into production lots:

**Lot Assignment:**
- Create new lot from intake
- Add to existing lot
- Split into multiple lots

**Lot Information:**
- Lot number/name
- Variety and source
- Target wine style
- Initial volume

Lots track through the entire production process.`
      },
      {
        title: 'Weight Tickets',
        content: `Document all weights:

**Records Include:**
- Gross weight (truck + grapes)
- Tare weight (empty truck)
- Net weight (grapes only)
- Scale ticket number

**Reporting:**
- Daily intake summary
- Source comparisons
- Payment calculations`
      }
    ],
    relatedDocs: ['operations/harvest', 'production/fermentation', 'production/dashboard']
  },

  'production/fermentation': {
    title: 'Fermentation Tracking',
    tool: 'Production',
    description: 'Monitor and manage wine fermentation with detailed logging.',
    sections: [
      {
        title: 'Overview',
        content: `Fermentation Tracking is your command center for monitoring all active fermentations. Track temperature, Brix, and other parameters to ensure healthy ferments.

Features:
- Real-time monitoring
- Automated logging (with sensors)
- Manual log entry
- Alert notifications`
      },
      {
        title: 'Active Fermentations',
        content: `View all fermenting lots:

**Fermentation Cards Show:**
- Lot name and vessel
- Current Brix
- Temperature
- Days fermenting
- Status indicator

**Quick Access:**
- Click for details
- Add log entry
- Update status

[PICTURE NEEDED: Fermentation dashboard with lot cards]`
      },
      {
        title: 'Logging Parameters',
        content: `Record fermentation data:

**Standard Parameters:**
- Brix / Specific gravity
- Temperature
- pH
- Free SO2

**Additional Data:**
- Cap management (punch downs, pump overs)
- Additions (yeast, nutrients, etc.)
- Sensory notes
- Problems/issues

**Log Entry:**
1. Select lot
2. Enter date/time
3. Record parameters
4. Add notes
5. Save log

[PICTURE NEEDED: Fermentation log entry form]`
      },
      {
        title: 'Fermentation Curves',
        content: `Visualize fermentation progress:

**Charts:**
- Brix over time
- Temperature over time
- Combined view

**Analysis:**
- Compare to targets
- Identify stuck ferments
- Predict completion

[PICTURE NEEDED: Fermentation curve chart showing Brix decline]`
      },
      {
        title: 'Alerts and Actions',
        content: `Stay on top of ferments:

**Alert Types:**
- Temperature out of range
- Stuck fermentation (Brix not dropping)
- Time-based reminders

**Action Suggestions:**
- When to punch down
- When to add nutrients
- When fermentation complete`
      }
    ],
    relatedDocs: ['production/harvest-intake', 'production/vessels', 'production/sensors']
  },

  'production/aging': {
    title: 'Aging Management',
    tool: 'Production',
    description: 'Track wine aging in barrels and tanks with timeline management.',
    sections: [
      {
        title: 'Overview',
        content: `Aging Management tracks wines through their maturation process. Monitor barrel aging, tank aging, and sur lie aging with detailed timelines and notes.

Features:
- Aging timeline tracking
- Barrel inventory management
- Topping and sampling records
- Aging program planning`
      },
      {
        title: 'Aging Lots',
        content: `Track wines in aging:

**Lot Information:**
- Wine name and vintage
- Variety/blend
- Current vessel
- Start date
- Target duration

**Status:**
- Days in vessel
- Days remaining
- Next action due

[PICTURE NEEDED: Aging lots list with timeline indicators]`
      },
      {
        title: 'Barrel Management',
        content: `Track your barrel inventory:

**Barrel Details:**
- Cooper and forest
- Toast level
- Age (number of fills)
- Current contents
- Location in cellar

**Barrel Actions:**
- Fill/empty
- Top up
- Rack
- Sample

[PICTURE NEEDED: Barrel inventory grid with status]`
      },
      {
        title: 'Aging Tasks',
        content: `Schedule and record aging activities:

**Common Tasks:**
- Topping: Replace evaporated wine
- Racking: Transfer off sediment
- Sampling: Pull for testing
- Stirring: For sur lie aging

**Scheduling:**
- Set recurring schedules
- Get reminders
- Log completions

[PICTURE NEEDED: Aging task calendar]`
      },
      {
        title: 'Aging Reports',
        content: `Analyze your aging program:

**Reports:**
- Wine inventory by age
- Barrel utilization
- Topping wine usage
- Projected completion dates

**Planning:**
- Barrel purchase needs
- Bottling schedules
- Blending timelines`
      }
    ],
    relatedDocs: ['production/vessels', 'production/blending', 'production/bottling']
  },

  'production/blending': {
    title: 'Blending Calculator',
    tool: 'Production',
    description: 'Plan and calculate wine blends with component analysis.',
    sections: [
      {
        title: 'Overview',
        content: `The Blending Calculator helps you plan wine blends by analyzing how different component wines will combine. Calculate final parameters, test different ratios, and save blend recipes.

Features:
- Component selection
- Parameter calculation
- Ratio optimization
- Recipe saving`
      },
      {
        title: 'Creating a Blend',
        content: `Start a new blend:

1. Click "New Blend"
2. Name your blend
3. Add component wines:
   - Select from your lots
   - Enter percentage or volume
4. View calculated results
5. Adjust ratios as needed
6. Save blend recipe

[PICTURE NEEDED: Blend creation interface with component selector]`
      },
      {
        title: 'Blend Calculations',
        content: `The calculator determines:

**Chemical Parameters:**
- Final pH (weighted average)
- Final TA
- Final alcohol
- Final RS

**Blending Math:**
- Pearson Square for alcohol
- Volume calculations
- Component volumes needed

[PICTURE NEEDED: Blend calculation results panel]`
      },
      {
        title: 'Trial Blends',
        content: `Test different ratios:

**Process:**
1. Set up component wines
2. Try different percentages
3. Compare results
4. Save favorite combinations

**Bench Trials:**
- Calculate small-scale volumes
- Print trial recipes
- Record tasting notes`
      },
      {
        title: 'Executing Blends',
        content: `When ready to blend:

1. Select your saved recipe
2. Confirm component availability
3. Generate work order
4. Record actual volumes used
5. Create new lot from blend

The system tracks blend history and component origins.`
      }
    ],
    relatedDocs: ['production/aging', 'production/lab', 'production/bottling']
  },

  'production/vessels': {
    title: 'Vessels (Container Management)',
    tool: 'Production',
    description: 'Manage all winery tanks, barrels, and containers.',
    sections: [
      {
        title: 'Overview',
        content: `Container Management tracks all vessels in your winery - tanks, barrels, bins, and any other containers used in production. Know what's where and what's available.

Features:
- Complete vessel inventory
- Capacity tracking
- Current contents
- Maintenance history`
      },
      {
        title: 'Vessel Types',
        content: `Track different container types:

**Tanks:**
- Stainless steel fermenters
- Storage tanks
- Variable capacity tanks
- Concrete eggs
- Amphorae

**Barrels:**
- French oak barrels
- American oak barrels
- Neutral barrels
- Puncheons

**Other:**
- Picking bins
- Totes
- Carboys

[PICTURE NEEDED: Vessel inventory organized by type]`
      },
      {
        title: 'Adding Vessels',
        content: `Register a new vessel:

1. Click "Add Vessel"
2. Enter details:
   - **Name/Number**: Identifier
   - **Type**: Tank, barrel, etc.
   - **Capacity**: Maximum volume
   - **Material**: Stainless, oak, etc.
   - **Location**: Where in cellar
   - **Purchase Date**: When acquired
3. Save vessel

[PICTURE NEEDED: Add vessel form]`
      },
      {
        title: 'Vessel Status',
        content: `Track what's in each vessel:

**Status Options:**
- Empty (available)
- In use (contents details)
- Cleaning (being sanitized)
- Maintenance (out of service)

**Contents Tracking:**
- Current lot/wine
- Fill level/volume
- Since date
- Temperature (if monitored)

[PICTURE NEEDED: Vessel detail view showing contents and history]`
      },
      {
        title: 'Vessel Operations',
        content: `Record vessel activities:

**Common Operations:**
- Fill: Add wine to vessel
- Transfer: Move wine between vessels
- Rack: Separate wine from sediment
- Clean: Sanitization record
- Repair: Maintenance work

Each operation is logged with date, volume, and operator.`
      }
    ],
    relatedDocs: ['production/fermentation', 'production/aging', 'production/dashboard']
  },

  'production/sensors': {
    title: 'IoT Sensors',
    tool: 'Production',
    description: 'Connect and monitor temperature and fermentation sensors.',
    sections: [
      {
        title: 'Overview',
        content: `The IoT Sensors page manages connected monitoring devices in your winery. Track fermentation and storage temperatures automatically with real-time data and alerts.

Supported sensors:
- Temperature probes
- Fermentation monitors
- Environmental sensors`
      },
      {
        title: 'Connecting Sensors',
        content: `Add a new sensor:

1. Click "Add Sensor"
2. Select sensor type
3. Enter connection details:
   - Device ID or API key
   - Connection method
   - Sync frequency
4. Assign to vessel (optional)
5. Set alert thresholds
6. Test connection
7. Save sensor

[PICTURE NEEDED: Sensor setup form]`
      },
      {
        title: 'Monitoring Dashboard',
        content: `View all sensor data:

**Display Options:**
- Current readings
- Historical charts
- Alert status
- Connection status

**Grouping:**
- By location
- By vessel
- By sensor type

[PICTURE NEEDED: Sensor monitoring dashboard with readings]`
      },
      {
        title: 'Temperature Alerts',
        content: `Get notified of temperature issues:

**Alert Configuration:**
- High temperature threshold
- Low temperature threshold
- Rate of change alerts

**Notifications:**
- In-app alerts
- Email notifications
- SMS alerts (premium)

Critical for catching stuck ferments or cooling failures.`
      },
      {
        title: 'Data Integration',
        content: `Sensor data flows into production:

**Automatic Logging:**
- Fermentation logs auto-populated
- Temperature history saved
- Reduces manual entry

**Analysis:**
- Correlate temp with fermentation curve
- Identify patterns
- Optimize processes`
      }
    ],
    relatedDocs: ['production/fermentation', 'production/vessels', 'operations/devices']
  },

  'production/lab': {
    title: 'Wine Analysis (Lab)',
    tool: 'Production',
    description: 'Record and track laboratory wine analysis results.',
    sections: [
      {
        title: 'Overview',
        content: `The Wine Analysis page (Lab) is where you record and track all wine testing results. Maintain a complete analytical record for each wine from crush to bottle.

Features:
- Analysis recording
- Parameter tracking
- Trend analysis
- Reference ranges`
      },
      {
        title: 'Recording Analysis',
        content: `Enter lab results:

1. Select the wine lot
2. Enter analysis date
3. Record parameters:
   - **Basic**: Brix/SG, pH, TA
   - **Sulfur**: Free SO2, Total SO2, Molecular SO2
   - **Other**: VA, Alcohol, RS, Malic, Color
4. Add notes
5. Save analysis

[PICTURE NEEDED: Lab analysis entry form with all parameters]`
      },
      {
        title: 'Analysis History',
        content: `View historical data:

**Wine History:**
- All analyses for a lot
- Parameter trends over time
- Charts and graphs

**Comparison:**
- Compare lots
- Compare vintages
- Benchmark against targets

[PICTURE NEEDED: Analysis history chart showing parameter trends]`
      },
      {
        title: 'Reference Ranges',
        content: `Set target parameters:

**Style Guidelines:**
- White wine ranges
- Red wine ranges
- Sparkling ranges
- Custom targets

**Alerts:**
- Out of range warnings
- Action recommendations
- Quality flags`
      },
      {
        title: 'Lab Reports',
        content: `Generate analysis reports:

**Report Types:**
- Certificate of Analysis (COA)
- Wine specifications
- Compliance documentation

**Export:**
- PDF format
- Include/exclude parameters
- Add company branding`
      }
    ],
    relatedDocs: ['production/fermentation', 'production/bottling', 'production/blending']
  },

  'production/bottling': {
    title: 'Bottling Management',
    tool: 'Production',
    description: 'Plan and track wine bottling runs and packaging.',
    sections: [
      {
        title: 'Overview',
        content: `Bottling Management helps you plan, execute, and record bottling runs. Track inventory from bulk wine through finished goods.

Features:
- Bottling planning
- Run tracking
- Inventory management
- Label compliance`
      },
      {
        title: 'Planning a Bottling Run',
        content: `Prepare for bottling:

1. Click "New Bottling Run"
2. Select wine lot(s) to bottle
3. Enter target details:
   - Number of cases
   - Bottle size
   - Closure type
4. Calculate requirements:
   - Bottles needed
   - Closures needed
   - Labels needed
5. Schedule date
6. Assign team

[PICTURE NEEDED: Bottling run planning form]`
      },
      {
        title: 'Recording Bottling',
        content: `Document the bottling run:

**Pre-Bottling:**
- Final analysis results
- Filtration records
- SO2 adjustment

**During Bottling:**
- Start/end times
- Cases produced
- Fill levels checked
- Issues encountered

**Post-Bottling:**
- Final case count
- Inventory updated
- QC samples pulled

[PICTURE NEEDED: Bottling run completion form]`
      },
      {
        title: 'Finished Goods',
        content: `Track bottled inventory:

**Inventory:**
- Cases by SKU
- Location in warehouse
- Lot traceability

**Movement:**
- Cases bottled
- Cases sold/shipped
- Adjustments

[PICTURE NEEDED: Finished goods inventory list]`
      },
      {
        title: 'Label Compliance',
        content: `Ensure labels meet requirements:

**TTB Requirements:**
- Alcohol statement
- Volume statement
- Appellation
- Producer name

**Tracking:**
- COLA numbers
- Label versions
- Approval dates`
      }
    ],
    relatedDocs: ['production/lab', 'production/aging', 'production/analytics']
  },

  'production/analytics': {
    title: 'Production Analytics',
    tool: 'Production',
    description: 'Analyze winery production data and performance metrics.',
    sections: [
      {
        title: 'Overview',
        content: `Production Analytics provides insights into your winery operations through data analysis and reporting. Understand efficiency, quality, and trends.

Key reports:
- Production volume analysis
- Quality metrics
- Efficiency reports
- Cost analysis`
      },
      {
        title: 'Volume Analysis',
        content: `Track production volumes:

**Metrics:**
- Gallons by variety
- Cases bottled
- Yield from fruit
- Loss percentages

**Trends:**
- Year-over-year comparison
- Monthly production
- Seasonal patterns

[PICTURE NEEDED: Production volume charts by variety]`
      },
      {
        title: 'Quality Metrics',
        content: `Monitor wine quality:

**Analysis Trends:**
- Average parameters by lot
- Quality score distributions
- Out-of-spec frequency

**Comparisons:**
- This vintage vs. previous
- Lot-to-lot variation
- Benchmark comparisons`
      },
      {
        title: 'Efficiency Reports',
        content: `Measure operational efficiency:

**Metrics:**
- Vessel utilization rate
- Turnaround times
- Labor hours per gallon
- Energy usage

**Optimization:**
- Identify bottlenecks
- Capacity planning
- Process improvements`
      },
      {
        title: 'Custom Reports',
        content: `Build custom analyses:

**Report Builder:**
- Select parameters
- Choose date ranges
- Filter by variety, lot, etc.
- Export results

**Saved Reports:**
- Save frequently used reports
- Schedule automatic generation
- Share with team`
      }
    ],
    relatedDocs: ['production/dashboard', 'production/reports', 'operations/analytics']
  },

  'production/reports': {
    title: 'Production Reports',
    tool: 'Production',
    description: 'Generate compliance and production reports for TTB and other requirements.',
    sections: [
      {
        title: 'Overview',
        content: `Production Reports generates the documentation needed for regulatory compliance and business operations. Create TTB reports, inventory reports, and custom documents.

Report types:
- TTB compliance reports
- Inventory reports
- Production summaries
- Custom reports`
      },
      {
        title: 'TTB Reports',
        content: `Generate required federal reports:

**Report 5120.17:**
- Monthly report of operations
- Wine premises records
- Automatic calculation from data

**Requirements:**
- Beginning inventory
- Production (crush, fermentation)
- Removals (bottled, transferred)
- Ending inventory

[PICTURE NEEDED: TTB report preview]`
      },
      {
        title: 'Inventory Reports',
        content: `Track inventory status:

**Bulk Wine Inventory:**
- Gallons by variety
- By location/vessel
- Aging status

**Finished Goods:**
- Cases by SKU
- Warehouse location
- Available for sale`
      },
      {
        title: 'Production Summaries',
        content: `Period summaries:

**Reports:**
- Daily production log
- Weekly summary
- Monthly production report
- Annual review

**Contents:**
- Intake records
- Processing activities
- Bottling runs
- Inventory changes`
      },
      {
        title: 'Export Options',
        content: `Get reports in usable formats:

**Formats:**
- PDF for printing/sharing
- Excel for data analysis
- CSV for imports

**Scheduling:**
- Generate on-demand
- Schedule automatic generation
- Email delivery`
      }
    ],
    relatedDocs: ['production/analytics', 'production/dashboard', 'production/bottling']
  },

  'production/archives': {
    title: 'Production Archives',
    tool: 'Production',
    description: 'Access archived production lots and historical fermentation data.',
    sections: [
      {
        title: 'Overview',
        content: `Production Archives stores completed production records for historical reference. Access old vintages, archived lots, and historical fermentation data.

Contents:
- Completed wine lots
- Historical fermentation logs
- Past analysis records
- Bottling records`
      },
      {
        title: 'Archived Lots',
        content: `Browse completed production:

**Viewing Archives:**
- Filter by vintage year
- Search by lot name
- Filter by variety

**Lot Details:**
- Complete production history
- All log entries
- Analysis records
- Final disposition

[PICTURE NEEDED: Archive browser with filters]`
      },
      {
        title: 'Historical Data',
        content: `Access past records:

**Fermentation Logs:**
- Historical curves
- What worked well
- Problems encountered

**Analysis History:**
- Parameter trends
- Quality comparisons
- Benchmarking data`
      },
      {
        title: 'Restoring Records',
        content: `Bring archives back to active:

**Why Restore:**
- Found additional wine
- Error in archiving
- Reference active lot

**Process:**
1. Find archived lot
2. Click "Restore"
3. Confirm restoration
4. Lot returns to active status`
      }
    ],
    relatedDocs: ['production/dashboard', 'production/fermentation']
  },

  // ============================================================================
  // ACCOUNT DOCUMENTATION
  // ============================================================================

  'account/settings': {
    title: 'Account Settings',
    tool: 'Account',
    description: 'Manage your profile, preferences, and account settings.',
    sections: [
      {
        title: 'Overview',
        content: `Account Settings lets you customize your Trellis experience and manage your account. Update your profile, set preferences, and configure notifications.

Sections:
- Profile
- Display preferences
- Notifications
- Security
- Vineyard settings`
      },
      {
        title: 'Profile',
        content: `Manage your personal information:

**Editable Fields:**
- Display name
- Email address
- Phone number
- Profile picture
- Time zone

**Business Information:**
- Company name
- Role/title
- Location

[PICTURE NEEDED: Profile settings page]`
      },
      {
        title: 'Display Preferences',
        content: `Customize the interface:

**Theme:**
- Light mode
- Dark mode
- System default

**Units:**
- Imperial (acres, gallons)
- Metric (hectares, liters)

**Date Format:**
- MM/DD/YYYY
- DD/MM/YYYY
- YYYY-MM-DD`
      },
      {
        title: 'Notifications',
        content: `Control what alerts you receive:

**Notification Types:**
- Task reminders
- System alerts
- Team activity
- Weather alerts

**Delivery Methods:**
- In-app notifications
- Email notifications
- SMS (if enabled)

**Frequency:**
- Real-time
- Daily digest
- Weekly summary`
      },
      {
        title: 'Security',
        content: `Keep your account secure:

**Password:**
- Change password
- Password requirements

**Two-Factor Authentication:**
- Enable/disable 2FA
- Backup codes

**Sessions:**
- View active sessions
- Sign out other devices`
      }
    ],
    relatedDocs: ['operations/my-vineyard']
  }
};

/**
 * Get documentation for a specific page
 */
export function getDoc(docId) {
  return docsContent[docId] || null;
}

/**
 * Get all docs for a specific tool
 */
export function getDocsByTool(tool) {
  return Object.entries(docsContent)
    .filter(([_, doc]) => doc.tool === tool)
    .map(([id, doc]) => ({ id, ...doc }));
}

/**
 * Search documentation
 */
export function searchDocs(query) {
  const q = query.toLowerCase();
  return Object.entries(docsContent)
    .filter(([id, doc]) => {
      return (
        doc.title.toLowerCase().includes(q) ||
        doc.description.toLowerCase().includes(q) ||
        doc.sections.some(s =>
          s.title.toLowerCase().includes(q) ||
          s.content.toLowerCase().includes(q)
        )
      );
    })
    .map(([id, doc]) => ({ id, ...doc }));
}
