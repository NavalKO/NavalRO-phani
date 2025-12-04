export const HARDCODED_TRANSCRIPT = `Chestha/ Phani - 2025/11/24 14:46 GMT+05:30 -
Transcript
Attendees
Chestha Arora, Chestha Arora's Presentation, Phanindra Karunakaram
Transcript
Phanindra Karunakaram: This earphone is not working properly.
Chestha Arora: I have any? Yes. Okay.
Phanindra Karunakaram: One second. Hello. Check. Okay.
Chestha Arora: I can hear Take a minute.
Phanindra Karunakaram: So, what I want you to do is just in simple English, Open the rooting playground.
And tell me a scenario that if a customer wants business objectives for the specific scenario what are the
keys that you usually switch on in the config and try to cover as many scenarios as possible right in
English so that I can use the transcript afterwards.
Chestha Arora: All right. Give me one second.
Phanindra Karunakaram: Let's first pick a scenario…
Phanindra Karunakaram: where it is very much prominent and the number of cases that we get for
optimization on these fronts is very high.
Chestha Arora: Yeah. Yeah.
Chestha Arora: One second.
Phanindra Karunakaram: You can just voice over the keys while you go about it. It's okay. You can take it
normal way.
Chestha Arora: So let's take a business case first where we are doing optimization B for majorly
companies which are doing store delivery or taking care of store distribution. the constraints that we
majorly
00:05:00
Phanindra Karunakaram: Do you want to do tour or do you want to take a c scenario? Just checking
before we go. Which one is more PC's keep coming in business scenario meaning in a career express
parcel delivery scenario or…
Phanindra Karunakaram:
Chestha Arora: Majorly volume tags is something that we H recently it's been CP …
Phanindra Karunakaram: is it in a retail distribution which ones you keep getting a lot more in general the
number of requests or prospective customers in a specific domain Okay,…
Chestha Arora: but last year yes it was distribution should I cover distribution so when we talk about
distribution the majorly we need to take care of aspects that…
Phanindra Karunakaram: we can go about it then. Go ahead. No problem.
Chestha Arora: how much orders or volumes can fit into one
Chestha Arora: what are the shift hours of the drivers or the working hours of the vehicles? what are the
skill sets that are attributed to a vehicles or a driver? and how they can do the multi-rips within the
confined working hours. To take care of majorly these four constraints, what we do is in the constraint
types, we enable the keys of volume. We input time as a constraint.
Chestha Arora: We also put tags as a constraint. These three figures go here once. Yeah.
Phanindra Karunakaram: Sorry one point here before we dive deep in.
Phanindra Karunakaram: So the business case is we are dealing with some kind of retailer or distribution
or any other scenario where the need is that we want to plan for a set of consignments using the fleet of
vehicles and majority or more often than not we run into use cases where you have to consider the weight
or volume of the vehicles. We have to consider the time slots and working hours of the workers. You have
to consider the delivery time slots of these locations either be at a retail store or any other location and
also ensure that the mapping of skill sets with the respective vehicles to the consignment that we handle
is done. So for these cases we use the following tags.
Phanindra Karunakaram: The following constraints. three Volume and weight could interchange between
each other. service time, but that comes under tags.
Chestha Arora: deliver volume. Yeah.
Phanindra Karunakaram: That's And what else? Time is a constraint, So in constraints itself, you have
constraints of time, tags, weight, volume. These are blocks. Now in this we can have multiple branching.
So we could have different kinds of objectives. an organization let's say if they say that I have the
following vehicles and these vehicles are all bought by me. So there is no point in reducing the number of
vehicles. You approach it in one way and if another person says no I want to reduce the total number of
roots and reduce the number of vehicles used. You approach it in a different way.
Phanindra Karunakaram: So there is a component or a kind of angle in the business case of fixed cost. So
if the fixed cost in terms of using a vehicle is always there because these vehicles are bought by the
customer, you don't really have to reduce the vehicles rather you need to make very tight clusters and
better distribution versus in another use cases…
Phanindra Karunakaram: where let's say they can reduce their so minimizing the number of vehicles is
still fine then we have a different branch for it. Is it correct?
Chestha Arora: Yeah. Taking one branch for example…
Phanindra Karunakaram: Let's pick one branch and then we go about it.
Chestha Arora: where we have our own vehicles and the customer has its own vehicles and they are not
majorly concerned about that I should use less vehicles because they need to optimize for the entire fleet
that they have.
Chestha Arora: In that scenario we can choose under the trip property configurations there's a key called
equitable distribution configuration there we can equalize for all available vehicles and then we can also
select parameters on which property do you want to equalize is it based on time that meaning that if
there's a fleet of let's say 100 vehicles time based on time how much time they spending depending on
ground. that is a factor on which equalization will be done.
00:10:00
Chestha Arora: We could also choose volume but generally time as an industry norm is what customers
prefer. But there are other values as well.
Phanindra Karunakaram: So usually we use time.
Phanindra Karunakaram: So whenever there are fixed amount of vehicles we don't have to reduce it. Then
in the configurations we use equitable distribution config where we equalize for all available vehicles and
time as a subset for that. Okay. Yes.
Chestha Arora: Yeah. Another thing that we also do is we play around the configuration for speed. Most of
the optimizations that we do that we do on gradient speed based and we select here OSRM. that is one.
Chestha Arora: Another is if we are also talking about this business case where our customers are okay
that if the shift hours are let's say eight for any given vehicle we would want the drivers to be spending
more time out there on the ground. So we can also enable multi- trips. I'll also tell the exact configuration
what is that. But when we enable multi-rips, we also need to be cognizant of the fact when the vehicle
comes back to the hub, he is going to spend and some time in again loading and unloading of the vehicle
which factors in to the service time of the entire time that the vehicle is working. Those factors such as
loading time and base hub unloading time is also that we can fet a set as a static value.
Chestha Arora: This means in between trip one and…
Phanindra Karunakaram: What about round trips?
Chestha Arora: trip two it will add the hub loading time and hub unloading time as well and compute the
entire entire working hours of the thread and it'll come down to use multi-rip flow via photo we need to
enable multi-rips we set it as consecutive distance limit. This is not generally used but if that depends on
the output.
Chestha Arora: If we identify that the rooting that has been done or is not very good looking in terms of
clusters then we can also try a permutation and combination where we can enable this consecutive
distance limit. Here we can set value as delay let's say 5 kilometers depending upon how close we want
the clusters and here depending upon what is the type of consignments we are optimizing for generally
it's delivery then we write here delivery so what the optimizer does is it identifies that for all the delivery
consignments that are there I need to ensure
Chestha Arora: that the distance in between any two orders that are planned for a route that distance
consecutively is not exceeding 10 kilometers. if number one I would only take this decision…
Phanindra Karunakaram: Got it.
Phanindra Karunakaram: So, usually how do you take a decision to use consecutive distance or not?
Chestha Arora: if I have ran previous simulations and I have analyzed visibly on map that the trips are
looking very haywire. That means within one area multiple drivers are going number one number two I see
opportunities for better clustering. and that all this Q is just by visually looking at the output.
Chestha Arora: if to validate that what I also do is I run another simulation by testing with 10 kilometers
and set testing on consecutive distance limit. If my clustering visually looks better and none of the other
constraints is breaching that means …
Chestha Arora: if in my previous output there were only 10 drop tasks it should not exceed more than 10
in this simulation. If generally clients do not have a hard and…
Phanindra Karunakaram: So it's more of a visual input and…
Phanindra Karunakaram: then it is a user input of do I want to use consecutive distance and in what
sense? Got it. Okay, let's move on.
00:15:00
Chestha Arora: fast rule here. Okay.
Phanindra Karunakaram: Yeah. Yeah.
Chestha Arora: Break that Correct.
Phanindra Karunakaram: How often do we use I think not to often about the entire partitions and then
using partitions as a constraint is also very peculiar and one of use case because in this case it is a
requirement of customer having mapping of the zones. So it's okay. We can skip that.
Chestha Arora: Combine same address customers. This is very prominently used because to one
customer or to one store we might have many order line items and we can also choose.
Phanindra Karunakaram: I think it is important to elaborate a little bit on combined same address for
customer.
Chestha Arora: So yeah,…
Phanindra Karunakaram: I believe we use this for cases like a stop on a high level in generic terms. we
can call it as a stop.
Chestha Arora: correct. Yeah.
Phanindra Karunakaram: So a stop is a definition primarily you can club multiple consignments to a stop
using this key which is the combined same address for a customer and the parameters on which we can
combine are as it could be on phone number pin code address. Could you explain how these various
options can work?
Chestha Arora: So, commis address if we set it as true, it goes back to our consignment data file which
we upload here. It refers to the input data and identifies which of the fields have same value which we
select here. it clubs them together.
Chestha Arora: Example, if I set coordinates that I want to combine stop, I want to combine orders and
merge them into one stop on coordinates. Then whatever orders have same exact value of coordinates, it
will treat them as one stop. I can also select multiple values here. So one stop can only be defined for me
as a phone number and a coordinate. So even though coordinate might be same but phone numbers are
different then it will treat them as different stop. It is very important because for example if there are two
shops within one mall coord these two location will be same because the on the map for the mall will be
one.
Chestha Arora: But if phone numbers are different that means the receivers are different and…
Chestha Arora: it will treat them as two stops. we have not sure where round trip is. arbi,…
Phanindra Karunakaram: Our round trip is arbitrary engine,…
Phanindra Karunakaram: Just scroll.
Chestha Arora: right? Okay.
Phanindra Karunakaram: Enable arbitrary ends. I think something like that. End trip at the last top
attribute. What is the drop down? Left side.
Phanindra Karunakaram: Not or this case. So, Quickly while you are zooming in we have seen for a
specific use case…
Chestha Arora: Oops.
Phanindra Karunakaram: where it's more into distribution or retail or in any other case where the fleet is
not to be reduced. We need to use the same set of vehicles that are there without reducing them. We have
gone through all the following parameters that are required. let's take another case maybe where but you
need partitions for this flow right you don't usually get partition that's…
Chestha Arora: in previous case only hard constraints partitions is something that we can touch
Phanindra Karunakaram: what we discuss
Chestha Arora: that is case to case basis now that I think of it.
Chestha Arora: Number one for example if there are some customers also where they do not want to mix
orders of different geographies. Example, Dubai is a different geography and Shara is a different
geography and we do not want vehicles to be cross utilized. In that scenarios we can create hub
partitions as polygons and then we can select here partitions as hard constraint to true.
00:20:00
Phanindra Karunakaram: Ready? Yeah,…
Chestha Arora: Use hub geoence partitions as true. That another within these branching only while we
were talking about if we want to equalize or not the rest of the things remain more or less same. in this
same scenario, if we have another case where they want to equalize for minimum required vehicles
Phanindra Karunakaram: I think u LLM might get confused. So this is a separate scenario but the same
business use case wherein this is basically the other branch. If we want to reduce the number of vehicles
used in the optimization…
Phanindra Karunakaram: then we are going to see what parameters are going to change from the
previous. Yeah. Just Okay.
Chestha Arora: The only thing that is going to change here is in the key equitable distribution
configuration.
Chestha Arora: It will change from equalize for all available vehicles to equalize for minimum required
vehicle. And we can select here again time or volume. Generally we use time as a basis.
Phanindra Karunakaram: So the change is only in one key which is equitable distribution config. We
change it to equalize for required vehicles if you want to reduce the number of vehicles and the sub type
would be time as a selection. Okay. Got it.
Chestha Arora: That is it.
Chestha Arora: Now we can move to different industry type maybe. Yes. So in C what generally are cases
is that here also I'll bifurcate branches into two. One is that we know for 1 CP customers the problem
statement the larger picture could be that I have for example 50 drivers operating in a certain geography
and these are the areas assigned to them. The problem statement is that we need to optimize the roots
for these 50 drivers within the geographies assigned to them.
Phanindra Karunakaram: Yeah, we can see C maybe. Yeah.
Chestha Arora: So here the problem is more in how to sequence the tasks for the day for a given driver
than what areas should they cater to. So we already know the geographies based on the orders for the
day. we need to sequence the tasks for the drivers based on the set parameters that we'll talk about and…
Chestha Arora: how do the metrics look like that is business case one which we'll be covering now Feel it.
Phanindra Karunakaram: Yeah, I think this is business case two.
Phanindra Karunakaram: So, previously in business case one, we saw in a distribution context how we are
going to do and within that we have Scenario one where vehicles need to be used all of them without any
minimization. In scenario two, we have seen minimizing the number of vehicles. Now coming to business
case two, let's say in a career express parcel delivery context where more often than not the area in which
a driver serves is predefined compared to our previous business case where it is more of dynamic in
nature in the way that we can allocate the trips to a vehicle.
Phanindra Karunakaram: here in the Korea Express parcel context there are predefined areas. the
definition of an area or a geography or a zone can be multiple fronts. some organizations use a list of
post codes mapped to a career. Some organizations have a generic area name which could be present in
any of the consignment address. in some cases they would have a gojson or rather like a partition that
they would create which we can leverage. So in these cases the main objective is to create an optimal
sequence for the driver within the area that is allocated to him for the output or the optimization. even
here there could be two scenarios.
00:25:00
Phanindra Karunakaram: This is the first scenario where we are doing a intelligent sequencing of a
specific set of zones or areas to the drivers that are mapped. But we also have another scenario where it
is okay to load balance between adjoining zones or geographies between couers. What do I mean by this?
Let's say we have different partitions created. Every partition is mapped to a courier but on a one fine day
one of the courier has a lot of consignments where the couer is overflowing with a lot of packages. Now
the system can also do something called as load balancing between each other to expand the limits or
the boundaries or the vicinities of the entire zone that is allocated.
Phanindra Karunakaram: So these are the two scenarios that we will cover in business case two which is
career express and partial right.
Chestha Arora: Yes, generally we only use tags.
Phanindra Karunakaram: So what constraint do we usually use in CP?
Chestha Arora: Why I'll tell that is because the areas are al already scientifically designed in such a
manner that the drivers would get not more task than they can handle.
Phanindra Karunakaram: So usually it is tags that we use. Okay.
Chestha Arora: So yeah here we just use tax then we use gradient calculation source in trip property
configuration as OSRM.
Chestha Arora: In equitable distribution configuration, we select no equitable distribution because we
already know the drivers. Multitrips is generally not used in C. So it can be set as false unless specifically
mentioned by the client. then we just have same address customers. we can combine them majorly on
two factors. One is coordinates and another is phone number. So a com whichever orders have these two
unique properties as part of the order line item it will be considered as one stock. Then we have level
configurations partition as hard constraints true. Use hub geopence partition as tags true.
Phanindra Karunakaram: Got it.
Chestha Arora: Use of geopense partition as true. That is it.
Phanindra Karunakaram: And in the second scenario, we can use them. We need to use tags and soft
bounds as the constraint type.
Chestha Arora: Yes, I think What's that?
Phanindra Karunakaram:
Phanindra Karunakaram: Hold on. soft partition bounds as the constraint type. So two in scenario two of
C we use constraint type as tags soft partition bounds and in the partition expansion limit we put a factor
and this factor can be from 0 to 0 0 to 1 usually 0.1 or…
Chestha Arora: 0 to 1.
Phanindra Karunakaram: 0.5 as an expansion limit…
Chestha Arora: Yes, here I think microcluster source also here I'm not sure enable microcluster So that
will I thinking seems like it major
Phanindra Karunakaram: which let's say 5 to 10% is something practical that we can use and there is any
other key that we need to use here. No, I don't think this is And partitions as soft constraints. I I think we
can detail out this scenario afterwards. Fine.
Phanindra Karunakaram: Anything else apart from these both? I think this is fine for now. Got it. And can
you help me with one thing? So, outside I'll stop the recording.`;

export const HARDCODED_SCHEMA = JSON.stringify({
  "optimization_params": [
    {
      "id": "constraint_type",
      "pretty_name": "Constraint Type",
      "primary_type": "list",
      "secondary_type": "str",
      "options": ["weight", "volume", "number", "product_value", "service_time", "length", "width", "height", "tags", "time", "distance", "consecutive_distance", "group_segregate", "partition_bounds", "order_capacity_weight"],
      "deafult": [],
      "description": "List of Constraints to be considered while optimizing the plan.",
      "is_required": true,
      "disable": false
    },
    {
      "id": "equitable_distribution_config",
      "options": ["no_equitable_distribution", "equalise_all_vehicles", "least_required_vehicles"],
      "pretty_name": "Equitable Distribution Configuration",
      "primary_type": "nested_list",
      "secondary_type": null,
      "deafult": "no_equitable_distribution",
      "description": "Configure equitable distribution of resources across vehicles",
      "is_required": false,
      "section": "Other Configurations",
      "sub_section": "Trip Property Configuration",
      "equalise_all_vehicles": ["cost", "distance", "time", "tasks", "weight", "volume", "number", "product_value", "order_capacity_weight"],
      "least_required_vehicles": ["cost", "distance", "time", "tasks", "weight", "volume", "number", "product_value", "order_capacity_weight"],
      "disable": false
    },
    {
      "id": "matrix_cost_method",
      "options": ["default_speed_based", "gradient_speed_based"],
      "pretty_name": "Distance Calculation Source",
      "primary_type": "nested_list",
      "secondary_type": null,
      "deafult": "haversine",
      "description": "Source of truth for considering the distance between any two points",
      "is_required": false,
      "section": "Other Configurations",
      "sub_section": "Trip Property Configuration",
      "default_speed_based": ["osrm", "haversine"],
      "gradient_speed_based": ["tomtom", "google", "geoapify", "osrm", "here", "aws"],
      "disable": false
    },
    {
      "id": "combine_same_address_customers",
      "pretty_name": "Combine Same Address Customers",
      "primary_type": "boolean",
      "secondary_type": null,
      "deafult": false,
      "description": "Use intenal logic to identify tasks belonging to same end customer and combine such tasks (Default: False).",
      "is_required": false,
      "section": "Other Configurations",
      "sub_section": "Location Configuration",
      "disable": false
    },
    {
      "id": "combine_params_list",
      "pretty_name": "Combine on Consignment Parameters",
      "primary_type": "list",
      "secondary_type": "str",
      "options": ["Phone Number", "Pincode", "Address", "Coordinates", "Coordinate Proximity Based Grouping"],
      "deafult": ["Phone Number", "Address"],
      "description": "Consignment parameters should be considered as a criteria for combine same address flow (For example, same phone number and same address consignments should be combined into one). (Default: ['Phone Number', 'Address']).",
      "is_required": false,
      "section": "Other Configurations",
      "sub_section": "Location Configuration",
      "disable": false
    },
    {
      "id": "enable_multi_trip_via_pudo_flow",
      "pretty_name": "Use Multi Trip flow via PUDO",
      "primary_type": "boolean",
      "secondary_type": null,
      "deafult": false,
      "description": "Multi-Trip scenario is modelled by converting normal consignments as PUDO",
      "is_required": false,
      "section": "Other Configurations",
      "sub_section": "Trip Property Configuration",
      "disable": false
    },
    {
      "id": "hub_waiting_time_mins",
      "pretty_name": "Hub Waiting Time (minutes)",
      "primary_type": "int",
      "secondary_type": null,
      "deafult": 0,
      "description": "Time to wait at the hub before starting the next trip. Used with multi-trip flow (Default: 0 min).",
      "is_required": false,
      "section": "Other Configurations",
      "sub_section": "Default Handling Configuration",
      "disable": false
    },
    {
      "id": "hub_loading_time_mins",
      "pretty_name": "Hub Loading Time (minutes)",
      "primary_type": "int",
      "secondary_type": null,
      "deafult": 0,
      "description": "Time to wait at the hub before starting the next trip. Used with multi-trip flow (Default: 0 min).",
      "is_required": false,
      "section": "Other Configurations",
      "sub_section": "Default Handling Configuration",
      "disable": false
    },
    {
      "id": "hub_unloading_time_mins",
      "pretty_name": "Hub Unloading Time (minutes)",
      "primary_type": "int",
      "secondary_type": null,
      "deafult": 0,
      "description": "Time to wait at the hub before ending the previous trip. Used with multi-trip flow (Default: 0 min).",
      "is_required": false,
      "section": "Other Configurations",
      "sub_section": "Default Handling Configuration",
      "disable": false
    },
    {
      "id": "consecutive_distance_limit",
      "pretty_name": "Consecutive Distance Limit",
      "primary_type": "float",
      "secondary_type": null,
      "deafult": null,
      "description": "Defines the maximum allowed distance between two consecutive orders in a trip.",
      "is_required": false,
      "section": "Other Configurations",
      "sub_section": "Trip Property Configuration",
      "disable": false
    },
     {
      "id": "partitions_as_hard_contraint",
      "pretty_name": "Partitions as hard constraint",
      "primary_type": "boolean",
      "secondary_type": null,
      "deafult": false,
      "description": "Disable crossing partitions in the solutioning (Default: False).",
      "is_required": false,
      "section": "Other Configurations",
      "sub_section": "Partition Level Configuration",
      "disable": false
    },
    {
      "id": "use_partition_id_as_tag",
      "pretty_name": "Use Hub Geofence Partitions As Tags",
      "primary_type": "boolean",
      "secondary_type": null,
      "deafult": false,
      "description": "Use manually drawn partition ids as tags for vehicles(rider zone mapping) (Default: False).",
      "is_required": false,
      "section": "Other Configurations",
      "sub_section": "Partition Level Configuration",
      "disable": false
    },
    {
      "id": "use_hub_geofence_partitions",
      "pretty_name": "Use Hub Geofence Partitions",
      "primary_type": "boolean",
      "secondary_type": null,
      "deafult": false,
      "description": "Use manually drawn partitions ids (Default: False).",
      "is_required": false,
      "section": "Other Configurations",
      "sub_section": "Partition Level Configuration",
      "disable": false
    },
    {
      "id": "partition_expansion_limit",
      "pretty_name": "Partition Expansion Limit",
      "primary_type": "float",
      "secondary_type": null,
      "deafult": 1,
      "description": "Controls the limit till which a worker can visit a neighboring partition when Soft Partition Bounds constraint is on",
      "is_required": false,
      "section": "Other Configurations",
      "sub_section": "Partition Level Configuration",
      "disable": false
    }
  ]
});

export const HARDCODED_TEMPLATE = JSON.stringify({
  "organisation_id": "shipsyflowdemo",
  "task_list": [],
  "vehicles": [],
  "source": "ROUTING_PLAYGROUND",
  "gather_drop_reasons": true,
  "hub": {
    "id": "2157556510597582001",
    "code": "GWC DOHA",
    "name": "GWC DOHA",
    "current_strategy_id": null,
    "lng": 51.4044145,
    "lat": 25.1345167
  },
  "start_depot": [[25.1345167, 51.4044145]],
  "end_depot": [[25.1345167, 51.4044145]],
  "optimization_strategy": "XLRTE",
  "fetch_optimization_params": true,
  "constraint_type": [],
  "matrix_cost_method": {
    "value": "gradient_speed_based",
    "secondary_value": "osrm"
  },
  "equitable_distribution_config": {
    "value": "no_equitable_distribution"
  },
  "enable_multi_trip_via_pudo_flow": false,
  "cn_types_considered_for_consecutive_distance": [],
  "hub_waiting_time_mins": 0,
  "hub_loading_time_mins": 0,
  "hub_unloading_time_mins": 0,
  "combine_same_address_customers": false,
  "combine_params_list": [],
  "partitions_as_hard_contraint": false,
  "use_partition_id_as_tag": false,
  "use_hub_geofence_partitions": false,
  "micro_cluster_source": {
    "value": "H3"
  }
}, null, 2);
