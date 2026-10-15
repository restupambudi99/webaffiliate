export type GuideCategory = 'workspace' | 'lighting' | 'accessories';

export type GuideSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type Guide = {
  slug: string;
  title: string;
  category: GuideCategory;
  summary: string;
  readingMinutes: number;
  evidenceType: 'Editorial guide';
  reviewStatus: 'draft';
  sections: GuideSection[];
  sources: { label: string; url: string }[];
};

export const categories: Record<GuideCategory, { title: string; description: string }> = {
  workspace: {
    title: 'Workspace',
    description: 'Make more of the space you have, from the first measurement to the final setup.',
  },
  lighting: {
    title: 'Lighting',
    description: 'Choose light that suits your room, your task, and the way you work.',
  },
  accessories: {
    title: 'Accessories',
    description: 'Thoughtful details for a desk that is easier to use and maintain.',
  },
};

// Draft editorial frameworks. Product testing, rankings, prices, and affiliate links
// are deliberately absent. A real editor must review these before publication.
export const guides: Guide[] = [
  {
    slug: 'small-space-desk-setup',
    title: 'A useful desk, even in a small space',
    category: 'workspace',
    summary: 'Start with your daily tasks, measure the room you actually have, and give every addition a clear job.',
    readingMinutes: 3,
    evidenceType: 'Editorial guide',
    reviewStatus: 'draft',
    sections: [
      {
        heading: 'Measure the work, then the room',
        paragraphs: [
          'A small desk does not need a miniature version of every office accessory. It needs enough room for the work you do most often. Write down one normal session: opening a laptop, taking notes, joining a call, or spreading out papers. Lay out those items together before measuring. Their working footprint matters more than the size of a closed notebook or folded stand.',
          'Measure width and depth, then check the space around the desk. A chair must move, drawers must open, and the door still needs its full path. Mark a proposed footprint with removable tape. Sit at the taped area and rehearse the tasks on your list. This is a planning exercise, not a promise that a particular desk will suit everyone.',
        ],
      },
      {
        heading: 'Give the surface three jobs',
        paragraphs: [
          'Reserve a primary area for the keyboard or laptop, a flexible area for writing, and a small landing area for the objects that arrive with you. These zones can overlap at different times. For example, a tray can leave the desk when a notebook needs the same space. Avoid filling every spare corner before trying this arrangement.',
          'Move occasional supplies into nearby storage rather than buying a larger organizer for the desktop. The useful question is how often you reach for an item. A pen used hourly deserves easy access; spare cables do not. Keep one clear patch of surface so that a new task can begin without moving five other things first.',
        ],
      },
      {
        heading: 'Compare the hidden footprint',
        paragraphs: [
          'Accessory dimensions are only the beginning. A lamp needs room for its base and its moving head. A hub needs clearance for plugged-in connectors. A monitor arm may need space behind the desk. Sketch these areas before adding an item to a shortlist, and compare the manufacturer instructions with your actual furniture.',
        ],
        bullets: [
          'Check the position of sockets and the route to them.',
          'Leave usable space beside connected ports and opening drawers.',
          'Choose storage that can be reached from your normal seat.',
          'Check whether an accessory must be removed at the end of the day.',
        ],
      },
      {
        heading: 'Buy the missing function',
        paragraphs: [
          'Use your current setup for a few ordinary sessions and record the specific interruption you want to fix. If papers repeatedly cover the keyboard, storage may be the next step. If packing away takes too long, portability may matter more than extra capacity. Buy for that observed problem, then reassess the space. A coordinated collection is optional; a desk that supports your routine is the goal.',
        ],
      },
    ],
    sources: [],
  },
  {
    slug: 'choose-a-desk-lamp',
    title: 'Choose a desk lamp for the way you work',
    category: 'lighting',
    summary: 'Look beyond the shape of the lamp. Compare reach, controls, light output, and the position of your real tasks.',
    readingMinutes: 3,
    evidenceType: 'Editorial guide',
    reviewStatus: 'draft',
    sections: [
      {
        heading: 'Name the task you want to light',
        paragraphs: [
          'Reading printed pages, sketching, and working mainly on a screen place different demands on a desk lamp. Begin with the area you want illuminated and the time of day you use it. Try your usual room lighting first. A task lamp is easier to choose when you know which patch of the desk feels inadequately lit rather than assuming the whole room needs a brighter source.',
          'Map where a lamp could stand without occupying your writing area. For a clamp model, inspect the desk edge and compare it with the permitted thickness in the instructions. For a base model, cut a paper rectangle to its dimensions. Reach toward the proposed controls while seated. A lamp that fits the photograph may still be awkward beside your equipment.',
        ],
      },
      {
        heading: 'Read the specifications separately',
        paragraphs: [
          'Brightness and electricity use are separate specifications. ENERGY STAR explains that lumens describe light output, while watts describe power use. When comparing replaceable bulbs, look at the output you need rather than treating a larger wattage as automatically better. Total output alone does not show exactly how light will fall across your desk.',
          'Check whether the lamp uses a replaceable bulb or an integrated light source. Read the bulb, dimmer, and power-adapter requirements for that model. If you want adjustable brightness or light color, confirm that the actual controls offer those functions. Decide whether you prefer a physical switch, a touch control, or a remote control before paying for features you will rarely use.',
        ],
      },
      {
        heading: 'Check placement in your room',
        paragraphs: [
          'Rehearse the lamp position with your screen, notebook, and usual seating position. Look for reflections on the display and shadows where your hand moves. An adjustable head or arm may help you change the arrangement, but compare its reach and joint movement with the area you need to cover. Do not assume every adjustable design reaches the same places.',
        ],
        bullets: [
          'Can the head point at the work without facing you?',
          'Can you move the lamp without disturbing other objects?',
          'Is the switch accessible during your normal task?',
          'Does the cable reach the socket along a practical route?',
        ],
      },
      {
        heading: 'Keep a useful shortlist',
        paragraphs: [
          'Compare two or three candidates using the same task, available footprint, and control preferences. Save the manufacturer specifications and the current return terms for each. Where possible, view a demonstration or try the lamp in a comparable setting. This guide supplies a selection framework; it does not establish a universal brightness target or claim health benefits from a particular lighting product.',
        ],
      },
    ],
    sources: [
      { label: 'ENERGY STAR: Learn About Brightness', url: 'https://www.energystar.gov/products/learn-about-brightness' },
    ],
  },
  {
    slug: 'laptop-stand-vs-monitor-arm',
    title: 'Laptop stand or monitor arm?',
    category: 'workspace',
    summary: 'Two different tools, two different jobs. Choose around the screen you use, available space, and how often your desk changes.',
    readingMinutes: 3,
    evidenceType: 'Editorial guide',
    reviewStatus: 'draft',
    sections: [
      {
        heading: 'Start with the screen you already own',
        paragraphs: [
          'A laptop stand supports the laptop itself. A monitor arm supports a compatible external display, unless its manufacturer explicitly supplies a compatible laptop attachment. They solve different problems, so comparing them as interchangeable upgrades can lead to an unnecessary purchase. First decide whether you work mainly on the laptop screen, an external monitor, or both.',
          'If the laptop travels with you, consider how quickly the setup can be packed and rebuilt. A fixed arrangement may suit a desk that stays assembled; a foldable stand may be more practical where the table serves another purpose after work. Count the keyboard, mouse, charger, and cables in that decision. A stand alone does not describe the whole working setup.',
        ],
      },
      {
        heading: 'Compare the whole footprint',
        paragraphs: [
          'A stand raises a device while still occupying part of the surface. Check its actual base and the space needed to open the laptop. Decide whether you will type on the laptop or use a separate keyboard, then lay out that arrangement. For a vertical stand used with an external display, confirm the laptop maker supports your intended closed-display setup.',
          'An arm can change where a monitor sits, but its clamp, joints, and movement need room too. Check the space behind the desk and the area under the proposed clamp. Ergotron identifies mounting compatibility, weight, and movement clearance as selection factors. These are model-specific checks, not a reason to assume any arm fits any display or desk.',
        ],
      },
      {
        heading: 'Make compatibility a first filter',
        paragraphs: [
          'For a laptop stand, compare the permitted device dimensions, supported weight, contact points, and opening angle with your model. Consult the laptop instructions for ventilation and use requirements. For an arm, collect the display model, weight without its original stand, mounting pattern, and the furniture details. Remove incompatible options before comparing finish or accessories.',
        ],
        bullets: [
          'Laptop used alone: evaluate the complete stand and typing arrangement.',
          'External display kept on the desk: evaluate the arm and its mounting requirements.',
          'Shared table: prioritize setup and removal time.',
          'Frequent changes: compare the actual movement range with your tasks.',
        ],
      },
      {
        heading: 'Choose the smallest complete solution',
        paragraphs: [
          'Write one sentence describing the improvement you need: more room for papers, easier packing, or the ability to reposition a display. Test whether rearranging the existing stand already achieves it. If a purchase remains useful, include any extra keyboard, attachment, cable, or desk mounting requirement in the decision. This is a comparison of approaches rather than a tested ranking of products; exact fit still requires the relevant manuals.',
        ],
      },
    ],
    sources: [
      { label: 'Ergotron: How to Choose the Right Monitor Arm', url: 'https://blogs.ergotron.com/2020/06/18/choosing-an-arm/' },
    ],
  },
  {
    slug: 'cable-management',
    title: 'Cable management that stays easy to change',
    category: 'accessories',
    summary: 'Organize by connection and movement, then choose clips or trays that help you maintain the desk after the first tidy-up.',
    readingMinutes: 3,
    evidenceType: 'Editorial guide',
    reviewStatus: 'draft',
    sections: [
      {
        heading: 'Map the connections first',
        paragraphs: [
          'Before buying clips, trace each cable from device to destination. Make a simple list of the connections that stay in place and the ones you disconnect regularly. Identify cables whose purpose you cannot explain before moving them. Follow equipment instructions when disconnecting anything, and keep a quick reference so the setup can be restored without guessing.',
          'Place equipment where you intend to use it, then plan the routes. A tidy bundle is less useful if a charger ends up on the wrong side of the desk or a hub becomes difficult to reach. Start with the laptop cable and other daily connections. Let those remain accessible; route occasional connections around them rather than hiding everything equally.',
        ],
      },
      {
        heading: 'Account for movement',
        paragraphs: [
          'Check how the desk, display, laptop, and drawers move. With the equipment installed according to its instructions, confirm that planned cable routes do not obstruct that movement. Ergotron advises leaving cable slack when moving a display on an arm. Use the same planning question for other movable items: where must the cable reach during ordinary use?',
          'Avoid committing to a final bundle until you have rehearsed the full routine. Plug in the laptop, take it away, open the storage, and adjust the equipment you normally adjust. Keep connectors identifiable and reachable. A route that looks clear from the front can still be impractical when you need to replace one cable behind the desk.',
        ],
      },
      {
        heading: 'Match the organizer to the job',
        paragraphs: [
          'Clips can reserve a reachable landing point for frequently used cable ends. Reusable ties can group cables that follow the same route. A tray can provide a home for compatible equipment, but check its dimensions, load rating, and mounting instructions. Read the requirements for any power equipment you plan to place there, including ventilation and access.',
        ],
        bullets: [
          'Check the cable diameter against the clip opening.',
          'Confirm the attachment method suits the desk surface.',
          'Check tray clearance beside legs, drawers, and controls.',
          'Use labels that describe the device, not a temporary position.',
        ],
      },
      {
        heading: 'Leave yourself a service route',
        paragraphs: [
          'Organize one route at a time and photograph your own finished connections for reference. Use a consistent place for spare cables, with only the spares you can identify. When equipment changes, update the labels and remove the obsolete route. The measure of a useful system is whether you can find, unplug, and replace the right cable without rebuilding the desk. This guide covers organization; electrical installation and power loading should follow the relevant equipment instructions.',
        ],
      },
    ],
    sources: [
      { label: 'Ergotron: Cable slack when moving a monitor arm', url: 'https://blogs.ergotron.com/2020/06/18/choosing-an-arm/' },
    ],
  },
  {
    slug: 'usb-hub-checklist',
    title: 'The USB hub checklist before you buy',
    category: 'accessories',
    summary: 'A matching connector is only the beginning. Map your devices, charging requirements, display needs, and computer compatibility.',
    readingMinutes: 3,
    evidenceType: 'Editorial guide',
    reviewStatus: 'draft',
    sections: [
      {
        heading: 'List what must work at the same time',
        paragraphs: [
          'Start with a device inventory rather than a port count. Write down the exact computer model, each accessory, its connector, and whether it remains connected throughout the day. Include an external display, storage, memory cards, and a charger if you use them. Mark which devices must work simultaneously. This reveals the requirement that a photograph of a crowded hub cannot answer.',
          'Separate a travel setup from a permanent desk setup. A short attached cable may simplify packing but restrict where a hub sits. A larger dock may suit a stationary arrangement but require its own power adapter. Compare the entire assembly, including cables and adapters, with your available space and the time you want to spend connecting it.',
        ],
      },
      {
        heading: 'Verify the computer port',
        paragraphs: [
          'USB-C describes the connector, but you still need to verify the supported functions of the computer, hub, and cable. Microsoft documents situations where charging, display output, or other USB-C functions are limited by an incompatible combination. Read the documentation for the exact computer port you intend to use, because a machine may have ports with different capabilities.',
          'For a display, match the hub maker’s compatibility statement to your operating system, intended screen count, resolution, and refresh rate. Check whether additional software is required. For charging, compare the computer’s requirement with the hub’s stated delivery to the computer, plus the required charger and cable. A headline power figure may not answer every one of these questions.',
        ],
      },
      {
        heading: 'Check each port in context',
        paragraphs: [
          'A port list should distinguish data, display, and power functions. Confirm the stated data capability for the connections you plan to use and any restrictions on simultaneous use. Check physical spacing too: a wide flash drive or chunky connector may make a neighboring port difficult to access. Locate regularly used ports where you can reach them without pulling the whole hub forward.',
        ],
        bullets: [
          'Record the exact computer model and operating system.',
          'Confirm every required function in the hub documentation.',
          'Identify charger, cable, or software requirements.',
          'Check the maker’s support and current return process.',
        ],
      },
      {
        heading: 'Use a simple acceptance routine',
        paragraphs: [
          'Keep the checklist for your own setup. After receiving a hub, follow its instructions and verify each required connection, then your normal simultaneous workload. Confirm that reconnecting after travel or restarting behaves as expected. Record unresolved issues while support and return options are available. This framework does not certify a hub’s performance or compatibility; those conclusions require the exact specifications and a check with your actual equipment.',
        ],
      },
    ],
    sources: [
      { label: 'Microsoft Support: Fix USB-C problems in Windows', url: 'https://support.microsoft.com/en-us/windows/hardware/usb/fix-usb-c-problems-in-windows' },
    ],
  },
  {
    slug: 'compact-keyboards',
    title: 'A compact keyboard without daily compromises',
    category: 'accessories',
    summary: 'Choose the keys you need before choosing a layout name. A smaller footprint works best when it fits your actual typing habits.',
    readingMinutes: 3,
    evidenceType: 'Editorial guide',
    reviewStatus: 'draft',
    sections: [
      {
        heading: 'Audit your keys for one normal day',
        paragraphs: [
          'Before comparing keyboard sizes, note the keys you use during ordinary work. Include arrow keys, the number pad, function keys, navigation keys, and shortcuts inside your main applications. Look beyond typing a paragraph: editing a spreadsheet or moving through a timeline may expose requirements that a short typing demonstration misses. Keep this list beside the product layout photographs.',
          'Layout names and percentages are useful starting points, but inspect the exact arrangement. Two compact keyboards can place the same keys differently or require different combinations to reach them. Check the language layout and operating-system labels as well. A familiar-looking product image does not confirm that the version being sold matches your region or preferred arrangement.',
        ],
      },
      {
        heading: 'Trade space deliberately',
        paragraphs: [
          'Mark the dimensions of a candidate on the desk, leaving room for the mouse and the writing area you use. Decide what you would gain from the smaller footprint. If it only creates space for another object you do not need, the improvement may be limited. If it restores a usable note-taking area, that is a specific benefit you can compare.',
          'Think through any missing keys. An occasional shortcut may be easy to relearn; a key used repeatedly throughout a task may be less convenient behind a secondary layer. An optional separate number pad is another arrangement to consider, but count its storage and connection needs. The complete setup can be larger than the main keyboard alone.',
        ],
      },
      {
        heading: 'Compare daily use beyond the layout',
        paragraphs: [
          'Choose connection options around how you work. Check the stated device and operating-system support, switching process, charging method, and whether basic functions need companion software. For a shared room, listen to a realistic sound demonstration or try the keyboard where possible. Descriptions such as quiet, tactile, or comfortable are not substitutes for your own preference and room conditions.',
        ],
        bullets: [
          'Can you reach your frequent shortcuts in the intended layout?',
          'Do the labels match the version and system you use?',
          'Can you switch devices as simply as your routine requires?',
          'Are cleaning and replacement instructions available?',
        ],
      },
      {
        heading: 'Keep the learning cost visible',
        paragraphs: [
          'Before buying, rehearse your common tasks on a printed layout or an on-screen image. Identify the changes you are willing to learn and the ones that would interrupt your work. Compare candidates using that same checklist, and keep current return terms available if you need to assess the physical feel. This is a buying framework, not a tested assessment of switches, noise, durability, or health outcomes for any particular keyboard.',
        ],
      },
    ],
    sources: [],
  },
  {
    slug: 'desk-mat-guide',
    title: 'Does your desk need a mat?',
    category: 'accessories',
    summary: 'Decide what a mat should do, then compare its usable size, surface, edges, and care requirements with your desk routine.',
    readingMinutes: 3,
    evidenceType: 'Editorial guide',
    reviewStatus: 'draft',
    sections: [
      {
        heading: 'Give the mat a specific purpose',
        paragraphs: [
          'A desk mat can define an area for the keyboard and mouse or provide a surface you prefer for certain tasks. Begin by identifying the problem you want it to solve. If the desk already works well for typing, writing, and pointing, a mat may mainly be a visual choice. That is a valid preference, but it should not be confused with a performance requirement.',
          'List the tasks that happen on the proposed mat. Include handwriting, moving a mouse, placing a laptop, and clearing the desk. A single surface may suit some of these better than others. Do not assume that a product described as a desk mat is also a cutting surface, heat-resistant pad, or suitable place for every device; those uses need explicit manufacturer support.',
        ],
      },
      {
        heading: 'Measure the useful area',
        paragraphs: [
          'Use paper or removable tape to mark the proposed size, then place your normal equipment on it. Move the mouse through the range you actually use and open a notebook. Check whether the mat would run under a lamp base, monitor stand, or other object you move frequently. The right footprint is the one that serves these tasks without creating awkward boundaries.',
          'Check thickness and edge construction alongside length and width. Consider where your hands rest, how a notebook lies, and whether you want to move the mat regularly. Look for the exact dimensions of the selected variant. A lifestyle photograph can hide how close a mat sits to the desk edge or how much clear space it leaves.',
        ],
      },
      {
        heading: 'Read care instructions before material labels',
        paragraphs: [
          'Material names alone do not establish texture, durability, or cleaning behavior. Read the maker’s care instructions for the actual product. Decide whether that routine fits your habits and workspace. If spills are common, confirm what the manufacturer claims and how cleanup should be handled, rather than treating splash resistance as permission to soak a mat or leave liquids near electronics.',
        ],
        bullets: [
          'Check compatibility with your intended mouse and tasks.',
          'Confirm the recommended cleaning products and drying method.',
          'Check whether both sides are intended for use.',
          'Consider how the mat will be stored when the desk is cleared.',
        ],
      },
      {
        heading: 'Keep alternatives on the shortlist',
        paragraphs: [
          'A smaller mouse pad, a writing pad, or no additional surface may answer the need with fewer compromises. Compare these arrangements using the same task list. If you choose a full mat, start with the smallest size that covers your required area and verify its behavior in ordinary use. This guide does not claim that any material prevents scratches, improves tracking, or lasts longer without evidence for the specific product.',
        ],
      },
    ],
    sources: [],
  },
  {
    slug: 'desk-organizers',
    title: 'Choose an organizer around what you reach for',
    category: 'workspace',
    summary: 'A good storage plan starts with the objects you use. Compare trays, compartments, and drawers by access and real capacity.',
    readingMinutes: 3,
    evidenceType: 'Editorial guide',
    reviewStatus: 'draft',
    sections: [
      {
        heading: 'Sort by use before sorting by object',
        paragraphs: [
          'Gather the items currently on your desk and divide them into daily tools, active project materials, and occasional supplies. This is a planning method, not a universal rule for organization. Its purpose is to show which items deserve the easiest access. Remove things that belong elsewhere before calculating the capacity of a new organizer.',
          'Count and measure what remains. A pen compartment needs to hold the pens you actually keep; a paper tray needs to fit the largest document or folder you regularly use. Measure openings, not just the outside of a proposed product. If you plan to store charging equipment, follow its operating requirements rather than assuming an enclosed compartment is suitable.',
        ],
      },
      {
        heading: 'Compare access with capacity',
        paragraphs: [
          'Open trays let you see contents quickly, but the visible pile still needs limits. Divided organizers can give small objects a specific home, although compartments that are too narrow may waste space. Drawers can keep occasional supplies together, but opening them requires room. Compare these approaches by rehearsing how you would retrieve and replace an item during a task.',
          'Check the footprint in use. A tall organizer may occupy little desk area while blocking a view or competing with a lamp. A wide low tray may be easy to reach while taking the place of your notebook. Mark the product dimensions on the surface and account for any drawer or lid movement. Consider storage beside or under the desk if it remains easy to access.',
        ],
      },
      {
        heading: 'Keep active work separate',
        paragraphs: [
          'A permanent home for supplies is different from a temporary place for unfinished work. Give active papers one defined landing area and choose a moment to review it, such as the end of a project or your normal desk reset. An organizer with more slots will not decide which papers should stay. That decision belongs to your own filing routine.',
        ],
        bullets: [
          'Daily tools: prioritize easy retrieval and replacement.',
          'Active papers: define a visible capacity and review routine.',
          'Occasional supplies: consider nearby storage before desktop storage.',
          'Shared desks: consider a portable container for personal items.',
        ],
      },
      {
        heading: 'Try the arrangement before committing',
        paragraphs: [
          'Use containers you already own to rehearse the proposed categories for several normal sessions. Notice which objects stay out because their assigned home is inconvenient. Change the placement or reduce the contents before buying a finished organizer. Choose the form that fits the working routine you have observed. This guide compares storage approaches and does not establish a tested capacity, durability rating, or recommendation for a named product.',
        ],
      },
    ],
    sources: [],
  },
  {
    slug: 'monitor-arm-fit',
    title: 'Will a monitor arm fit your desk?',
    category: 'workspace',
    summary: 'Check the screen, mounting plate, desk edge, and movement space before adding an arm to your shortlist.',
    readingMinutes: 3,
    evidenceType: 'Editorial guide',
    reviewStatus: 'draft',
    sections: [
      {
        heading: 'Collect the exact model details',
        paragraphs: [
          'Start with the full model number on the display and find its manufacturer documentation. Record the weight without the original stand, supported mounting pattern, and any required adapter. Compare these with the arm’s complete supported range and instructions. Screen diagonal alone is not enough to establish fit. Keep the documents together so the decision can be checked without relying on a retailer’s short title.',
          'Inspect the rear mounting area in the manual or a clear image. A matching hole pattern does not answer every clearance question. Dell explains that some recessed mounting areas on its gaming and Alienware monitors can require spacers with certain third-party plates. Treat this as an example of a model-specific complication; use the instructions for your own display and arm.',
        ],
      },
      {
        heading: 'Inspect the desk from both sides',
        paragraphs: [
          'Measure the intended attachment point and look underneath it. An apron, drawer, metal frame, beveled edge, or cable tray may obstruct a clamp. Compare the measured desk thickness and available contact area with the mount instructions. Confirm that the furniture maker permits the proposed mounting method and loading. Do not infer suitability from thickness alone.',
          'If the mount uses a grommet opening, check the required opening and hardware against the desk rather than assuming an existing cable hole is appropriate. If the furniture documentation is unclear, resolve that question with the manufacturer before installation. Avoid improvised hardware or spacers; use only the parts and assembly approach approved for the exact combination.',
        ],
      },
      {
        heading: 'Sketch the movement you actually need',
        paragraphs: [
          'Mark where the screen should sit during normal work and where you want it moved for another task. Account for the wall behind the desk, nearby shelves, and the edges of other displays. Check the arm’s documented movement against that sketch. For more than one monitor, consider their physical widths and whether the intended positions leave room between them.',
        ],
        bullets: [
          'Verify display weight and mounting requirements.',
          'Measure the attachment point and inspect underside clearance.',
          'Check furniture suitability with the relevant documentation.',
          'Plan cable reach throughout the intended movement.',
        ],
      },
      {
        heading: 'Treat installation as part of the choice',
        paragraphs: [
          'Read the setup instructions before purchase, including required tools, assistance, and adjustment steps. Decide whether you can perform that process as written. Follow the manufacturer’s checks after assembly and keep the instructions for future changes. This guide is a compatibility framework rather than an installation manual or a review of a specific arm. A purchase decision should wait until every unresolved fit question has a documented answer.',
        ],
      },
    ],
    sources: [
      { label: 'Ergotron: Monitor compatibility and adjustment considerations', url: 'https://blogs.ergotron.com/2020/06/18/choosing-an-arm/' },
      { label: 'Dell: Third-party VESA mounts and recessed mounting areas', url: 'https://www.dell.com/support/kbdoc/en-us/000197983/installing-a-3rd-party-vesa-mount-on-a-dell-gaming-or-alienware-monitor' },
    ],
  },
  {
    slug: 'desk-accessory-mistakes',
    title: 'Five questions before your next desk accessory',
    category: 'accessories',
    summary: 'Avoid buying for a photograph. Use a simple decision process that considers purpose, fit, upkeep, and the complete setup.',
    readingMinutes: 3,
    evidenceType: 'Editorial guide',
    reviewStatus: 'draft',
    sections: [
      {
        heading: 'What interruption are you trying to remove?',
        paragraphs: [
          'An appealing desk photograph can make an accessory feel necessary before you have identified its purpose. Write down the interruption you want to fix in concrete terms: the charging cable falls behind the desk, papers occupy the typing area, or packing a shared table takes too long. This gives you an observable result to compare with the cost and effort of a change.',
          'Try one rearrangement with what you already own. Move the supplies, change the landing place for cables, or reduce the items kept on the surface. Record whether the problem remains during an ordinary work session. A purchase is easier to judge when it answers a problem that this small experiment did not resolve.',
        ],
      },
      {
        heading: 'Does the whole setup fit?',
        paragraphs: [
          'A common planning mistake is measuring the accessory while overlooking the space needed to use it. Add connector clearance, drawer movement, cable routes, and room for your hands. Use a paper outline of the proposed footprint and place your usual equipment around it. If the item moves, map the positions you expect to use rather than measuring only its folded state.',
          'Check exact compatibility before comparing cosmetic options. Collect your device models and the relevant manufacturer instructions. A shared connector shape, a screen-size label, or a broad word such as universal should prompt further questions. Save the specifications that answer those questions so you can confirm the received item matches the selected version.',
        ],
      },
      {
        heading: 'What does ownership involve?',
        paragraphs: [
          'Include the extra pieces a purchase requires: cables, adapters, software, mounting hardware, or storage when not in use. Read the care instructions and decide whether you will follow them. Check how support, repairs, and returns are handled through the actual seller. These details can make a simple-looking addition more involved than its main product image suggests.',
        ],
        bullets: [
          'Purpose: name the interruption and the desired result.',
          'Fit: measure the space needed during use.',
          'Compatibility: verify the exact devices and version.',
          'Upkeep: read the cleaning, charging, and maintenance requirements.',
          'Completeness: count all required parts and setup steps.',
        ],
      },
      {
        heading: 'How will you know it helped?',
        paragraphs: [
          'Keep your original one-sentence problem and use it after installation. Check the new arrangement during the task that used to interrupt you. If the issue persists, adjust the setup according to its instructions and use the available support or return process where appropriate. Keep a purchase because it serves your routine, not because completing a matching collection became the goal. This framework offers questions for choosing; it makes no tested product rankings or universal promises about productivity.',
        ],
      },
    ],
    sources: [],
  },
];
