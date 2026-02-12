CREATE TABLE public.Account (
  id text NOT NULL DEFAULT (gen_random_uuid())::text,
  userId text NOT NULL,
  type text NOT NULL,
  provider text NOT NULL,
  providerAccountId text NOT NULL,
  refresh_token text,
  access_token text,
  expires_at integer,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  CONSTRAINT Account_pkey PRIMARY KEY (id),
  CONSTRAINT Account_userId_fkey FOREIGN KEY (userId) REFERENCES public.User(id)
);
CREATE TABLE public.RouteHistory (
  id text NOT NULL,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  routeName text,
  totalDistance double precision NOT NULL,
  totalTime double precision NOT NULL,
  totalStops integer NOT NULL,
  optimizationMethod text NOT NULL DEFAULT 'greedy'::text,
  CONSTRAINT RouteHistory_pkey PRIMARY KEY (id)
);
CREATE TABLE public.SavedRoute (
  id text NOT NULL,
  name text NOT NULL,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  vehicleName text NOT NULL,
  startingInventory integer NOT NULL,
  maxCapacity integer NOT NULL,
  totalDistance double precision NOT NULL,
  totalTime double precision NOT NULL,
  totalStops integer NOT NULL,
  totalPickups integer NOT NULL,
  totalDeliveries integer NOT NULL,
  stops jsonb NOT NULL,
  optimizationResult jsonb,
  CONSTRAINT SavedRoute_pkey PRIMARY KEY (id)
);
CREATE TABLE public.Session (
  id text NOT NULL DEFAULT (gen_random_uuid())::text,
  sessionToken text NOT NULL,
  userId text NOT NULL,
  expires timestamp without time zone NOT NULL,
  CONSTRAINT Session_pkey PRIMARY KEY (id),
  CONSTRAINT Session_userId_fkey FOREIGN KEY (userId) REFERENCES public.User(id)
);
CREATE TABLE public.SignOrder (
  id text NOT NULL DEFAULT (gen_random_uuid())::text,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  name text NOT NULL,
  address text NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  operationType text NOT NULL,
  pickupQuantity integer NOT NULL DEFAULT 0,
  deliveryQuantity integer NOT NULL DEFAULT 0,
  notes text,
  validFrom timestamp without time zone NOT NULL,
  validUntil timestamp without time zone NOT NULL,
  deliveryDate timestamp without time zone NOT NULL,
  pickupDate timestamp without time zone NOT NULL,
  status text NOT NULL DEFAULT 'Geplant'::text,
  CONSTRAINT SignOrder_pkey PRIMARY KEY (id)
);
CREATE TABLE public.User (
  id text NOT NULL DEFAULT (gen_random_uuid())::text,
  name text,
  email text NOT NULL,
  emailVerified timestamp without time zone,
  password text NOT NULL,
  image text,
  role text NOT NULL DEFAULT 'user'::text,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT User_pkey PRIMARY KEY (id)
);
CREATE TABLE public.VerificationToken (
  identifier text NOT NULL,
  token text NOT NULL,
  expires timestamp without time zone NOT NULL
);
CREATE TABLE public.lexware_contacts_full (
  id text NOT NULL,
  organization_id text,
  version integer,
  archived boolean,
  note text,
  x_rechnung text,
  salutation text,
  first_name text,
  last_name text,
  title text,
  date_of_birth date,
  company_name text,
  company_number text,
  vat_registration_id text,
  allow_tax_free_invoices boolean,
  industry text,
  customer_number text,
  customer_since date,
  vendor_number text,
  vendor_since date,
  billing_street text,
  billing_zip text,
  billing_city text,
  billing_country_code text,
  billing_additional text,
  shipping_street text,
  shipping_zip text,
  shipping_city text,
  shipping_country_code text,
  shipping_additional text,
  business_email text,
  private_email text,
  business_phone text,
  mobile_phone text,
  raw_json jsonb,
  CONSTRAINT lexware_contacts_full_pkey PRIMARY KEY (id)
);
CREATE TABLE public.t_abnahmen (
  abnahme_id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid,
  plan_id uuid,
  datum date,
  telefon text,
  auftrag text NOT NULL,
  rechnungs_name text,
  rechnungs_strasse text,
  rechnungs_plz text,
  rechnungs_ort text,
  arbeitsbeginn_vor_ort time without time zone,
  arbeitsende_vor_ort time without time zone,
  ende_wiegeschein time without time zone,
  zusatz_sonderstoffentsorgung boolean DEFAULT false,
  zusatz_sonstiges boolean DEFAULT false,
  zusatz_sonstiges_beschreibung text,
  fahrzeug text,
  folgetag text,
  wiegescheine_unvollstaendig boolean DEFAULT false,
  entsorgung_termin date,
  entsorgung_was text,
  mannanzahl integer,
  idr_im_lager_beschriftet boolean DEFAULT false,
  geliehenes_material text,
  hvz_vor_ort boolean DEFAULT false,
  hvz_mitgebracht boolean DEFAULT false,
  hvz_nummer text,
  unterschrift_auftraggeber text,
  unterschrift_baustellenleiter text,
  mv_umzugskartons integer,
  mv_packseide integer,
  mv_kleiderkisten integer,
  mv_klebeband integer,
  mv_lupo integer,
  mv_stretchfolie integer,
  mv_sonstiges text,
  mv_decken_anzahl integer,
  mv_kantenschutz_meter numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  abnahme_datum date,
  rechnung_zeile1 text,
  rechnung_zeile2 text,
  rechnung_zeile3 text,
  mat_umzugskartons integer,
  mat_packseide integer,
  mat_kleiderkisten integer,
  mat_klebeband integer,
  mat_lupo integer,
  mat_stretchfolie integer,
  mat_sonstiges text,
  mat_decken_anzahl integer,
  mat_kantenschutz_meter numeric,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  CONSTRAINT t_abnahmen_pkey PRIMARY KEY (abnahme_id)
);
CREATE TABLE public.t_analytics_events (
  event_id text NOT NULL,
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  level text NOT NULL CHECK (level = ANY (ARRAY['debug'::text, 'info'::text, 'warn'::text, 'error'::text, 'fatal'::text])),
  category text NOT NULL CHECK (category = ANY (ARRAY['auth'::text, 'navigation'::text, 'inspection'::text, 'abnahme'::text, 'sync'::text, 'offline'::text, 'user_action'::text, 'error'::text, 'performance'::text])),
  event_name text NOT NULL,
  user_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  error_message text,
  error_stack text,
  error_code text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT t_analytics_events_pkey PRIMARY KEY (event_id),
  CONSTRAINT t_analytics_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.t_users(user_id)
);
CREATE TABLE public.t_chat_messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  chat_id uuid NOT NULL CHECK (chat_id IS NOT NULL),
  role text NOT NULL CHECK (role = ANY (ARRAY['user'::text, 'assistant'::text, 'tool'::text])),
  content text NOT NULL,
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  tool_calls jsonb,
  tool_call_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT t_chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT t_chat_messages_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.t_chats(id)
);
CREATE TABLE public.t_chats (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL CHECK (user_id IS NOT NULL),
  title text NOT NULL DEFAULT 'Neuer Chat'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  message_count integer NOT NULL DEFAULT 0,
  is_shared boolean NOT NULL DEFAULT false,
  shared_with_user_ids ARRAY DEFAULT ARRAY[]::uuid[],
  CONSTRAINT t_chats_pkey PRIMARY KEY (id),
  CONSTRAINT t_chats_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.t_disposal_costs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  project_id uuid,
  waste_type text NOT NULL,
  used_unit numeric NOT NULL,
  cost_per_unit numeric NOT NULL,
  total_cost numeric DEFAULT (used_unit * cost_per_unit),
  created_at timestamp with time zone DEFAULT now(),
  phase text DEFAULT 'Nachkalkulation'::text,
  CONSTRAINT t_disposal_costs_pkey PRIMARY KEY (id),
  CONSTRAINT t_disposal_costs_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.t_projects(project_id)
);
CREATE TABLE public.t_employee_daily_notes (
  id integer NOT NULL DEFAULT nextval('t_employee_daily_notes_id_seq'::regclass),
  employee_code text NOT NULL,
  plan_date date NOT NULL,
  notizen text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  employee_id uuid,
  sort_order integer DEFAULT 999,
  CONSTRAINT t_employee_daily_notes_pkey PRIMARY KEY (id),
  CONSTRAINT t_employee_daily_notes_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.t_employees(employee_id)
);
CREATE TABLE public.t_employee_rate_history (
  hist_id bigint NOT NULL DEFAULT nextval('t_employee_rate_history_hist_id_seq'::regclass),
  employee_id uuid,
  old_hourly_rate numeric,
  new_hourly_rate numeric,
  changed_at timestamp with time zone DEFAULT now(),
  changed_by text,
  CONSTRAINT t_employee_rate_history_pkey PRIMARY KEY (hist_id),
  CONSTRAINT t_employee_rate_history_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.t_employees(employee_id)
);
CREATE TABLE public.t_employees (
  employee_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  employee_code text UNIQUE,
  name text NOT NULL,
  email text,
  phone text,
  role text,
  contract_type text,
  weekly_hours_contract numeric,
  hourly_rate numeric,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT t_employees_pkey PRIMARY KEY (employee_id)
);
CREATE TABLE public.t_feedback (
  feedback_id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  user_email text NOT NULL,
  feedback_type text NOT NULL CHECK (feedback_type = ANY (ARRAY['bug'::text, 'feature'::text, 'feedback'::text, 'sync_issue'::text, 'other'::text])),
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new'::text CHECK (status = ANY (ARRAY['new'::text, 'in_progress'::text, 'resolved'::text, 'closed'::text])),
  priority text DEFAULT 'medium'::text CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text])),
  assigned_to uuid,
  resolution_notes text,
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  resolved_at timestamp with time zone,
  CONSTRAINT t_feedback_pkey PRIMARY KEY (feedback_id),
  CONSTRAINT t_feedback_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.t_users(user_id),
  CONSTRAINT t_feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.t_users(user_id)
);
CREATE TABLE public.t_inspection_calc_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  inspection_id uuid,
  source_item_id bigint,
  kind text NOT NULL,
  position_label text,
  qty numeric NOT NULL DEFAULT 1,
  unit text,
  unit_price numeric NOT NULL DEFAULT 0,
  line_total numeric DEFAULT (qty * unit_price),
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT t_inspection_calc_items_pkey PRIMARY KEY (id),
  CONSTRAINT t_inspection_calc_items_inspection_id_fkey FOREIGN KEY (inspection_id) REFERENCES public.t_inspections(inspection_id)
);
CREATE TABLE public.t_inspection_discounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  inspection_id uuid,
  mode text NOT NULL,
  value numeric NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT t_inspection_discounts_pkey PRIMARY KEY (id),
  CONSTRAINT t_inspection_discounts_inspection_id_fkey FOREIGN KEY (inspection_id) REFERENCES public.t_inspections(inspection_id)
);
CREATE TABLE public.t_inspection_hvz (
  id integer NOT NULL DEFAULT nextval('t_inspection_hvz_id_seq'::regclass),
  inspection_id uuid NOT NULL,
  description text NOT NULL,
  quantity integer DEFAULT 1,
  price_per_unit numeric DEFAULT 0.00,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT t_inspection_hvz_pkey PRIMARY KEY (id),
  CONSTRAINT t_inspection_hvz_inspection_id_fkey FOREIGN KEY (inspection_id) REFERENCES public.t_inspections(inspection_id)
);
CREATE TABLE public.t_inspection_items (
  id bigint NOT NULL DEFAULT nextval('t_inspection_items_id_seq'::regclass),
  inspection_id uuid,
  room text,
  notes text,
  volume_m3 numeric,
  persons integer,
  hours numeric,
  sum_hours numeric DEFAULT ((COALESCE(persons, 0))::numeric * COALESCE(hours, (0)::numeric)),
  created_at timestamp with time zone DEFAULT now(),
  entsorgungskosten numeric NOT NULL DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now(),
  photo_url text,
  CONSTRAINT t_inspection_items_pkey PRIMARY KEY (id),
  CONSTRAINT t_inspection_items_inspection_id_fkey FOREIGN KEY (inspection_id) REFERENCES public.t_inspections(inspection_id)
);
CREATE TABLE public.t_inspection_materials (
  id integer NOT NULL DEFAULT nextval('t_inspection_materials_id_seq'::regclass),
  inspection_id uuid NOT NULL,
  material_id text NOT NULL,
  material_name text NOT NULL,
  quantity numeric DEFAULT 1.00,
  price_per_unit numeric DEFAULT 0.00,
  unit text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT t_inspection_materials_pkey PRIMARY KEY (id),
  CONSTRAINT t_inspection_materials_inspection_id_fkey FOREIGN KEY (inspection_id) REFERENCES public.t_inspections(inspection_id),
  CONSTRAINT t_inspection_materials_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.t_materials(material_id)
);
CREATE TABLE public.t_inspection_photos (
  id bigint NOT NULL DEFAULT nextval('t_inspection_photos_id_seq'::regclass),
  inspection_id uuid,
  url text,
  caption text,
  created_at timestamp with time zone DEFAULT now(),
  category text,
  CONSTRAINT t_inspection_photos_pkey PRIMARY KEY (id),
  CONSTRAINT t_inspection_photos_inspection_id_fkey FOREIGN KEY (inspection_id) REFERENCES public.t_inspections(inspection_id)
);
CREATE TABLE public.t_inspection_room_items (
  id integer NOT NULL DEFAULT nextval('t_inspection_room_items_id_seq'::regclass),
  inspection_id uuid NOT NULL,
  room_id integer NOT NULL,
  item_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  notes text,
  montage_option text NOT NULL DEFAULT 'Keine'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  photo_url text,
  CONSTRAINT t_inspection_room_items_pkey PRIMARY KEY (id)
);
CREATE TABLE public.t_inspection_signatures (
  id bigint NOT NULL DEFAULT nextval('t_inspection_signatures_id_seq'::regclass),
  inspection_id uuid,
  signer_name text,
  signed_at timestamp with time zone DEFAULT now(),
  signature_data text,
  CONSTRAINT t_inspection_signatures_pkey PRIMARY KEY (id),
  CONSTRAINT t_inspection_signatures_inspection_id_fkey FOREIGN KEY (inspection_id) REFERENCES public.t_inspections(inspection_id)
);
CREATE TABLE public.t_inspection_sonstiges (
  id integer NOT NULL DEFAULT nextval('t_inspection_sonstiges_id_seq'::regclass),
  inspection_id uuid NOT NULL,
  description text NOT NULL,
  quantity numeric DEFAULT 1.00,
  price_per_unit numeric DEFAULT 0.00,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT t_inspection_sonstiges_pkey PRIMARY KEY (id),
  CONSTRAINT t_inspection_sonstiges_inspection_id_fkey FOREIGN KEY (inspection_id) REFERENCES public.t_inspections(inspection_id)
);
CREATE TABLE public.t_inspection_vehicles (
  id integer NOT NULL DEFAULT nextval('t_inspection_vehicles_id_seq'::regclass),
  inspection_id uuid NOT NULL,
  vehicle_type text NOT NULL,
  quantity integer DEFAULT 1,
  price_per_unit numeric DEFAULT 0.00,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT t_inspection_vehicles_pkey PRIMARY KEY (id),
  CONSTRAINT t_inspection_vehicles_inspection_id_fkey FOREIGN KEY (inspection_id) REFERENCES public.t_inspections(inspection_id)
);
CREATE TABLE public.t_inspections (
  inspection_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  inspection_code text UNIQUE,
  project_id uuid,
  anrede text,
  name text,
  strasse text,
  nr text,
  plz text,
  ort text,
  telefon text,
  email text,
  appointment_at timestamp with time zone,
  status text DEFAULT 'Geplant'::text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  etage text,
  hvz text,
  sonderstoffe text,
  lkw_groesse text,
  zieladresse text,
  dienstleistungsart_w text,
  dienstleistungsart_p text,
  extrainformationen text,
  ziel_anrede text,
  ziel_name text,
  ziel_strasse text,
  ziel_nr text,
  ziel_plz text,
  ziel_ort text,
  titel text,
  ziel_titel text,
  aufzug_vorhanden text,
  ziel_aufzug_vorhanden text,
  wunschtermin text,
  aufzug_photo_url text,
  ziel_aufzug_photo_url text,
  hvz_noetig text,
  hvz_location text,
  hvz_photo_url text,
  lexoffice_contact_id text,
  lexoffice_quotation_id text,
  lexoffice_quotation_number text,
  lexoffice_order_confirmation_id text,
  lexoffice_order_confirmation_number text,
  customer_accepted boolean,
  customer_accepted_at timestamp with time zone,
  customer_declined_at timestamp with time zone,
  customer_decision_notes text,
  work_project_id uuid,
  CONSTRAINT t_inspections_pkey PRIMARY KEY (inspection_id),
  CONSTRAINT t_inspections_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.t_projects(project_id)
);
CREATE TABLE public.t_material_price_history (
  hist_id uuid NOT NULL DEFAULT gen_random_uuid(),
  material_id text,
  old_price numeric,
  new_price numeric,
  changed_at timestamp with time zone DEFAULT now(),
  changed_by text,
  CONSTRAINT t_material_price_history_pkey PRIMARY KEY (hist_id),
  CONSTRAINT t_material_price_history_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.t_materials(material_id)
);
CREATE TABLE public.t_material_prices (
  material_id text NOT NULL,
  cost_per_unit numeric,
  price_per_unit numeric,
  currency text DEFAULT 'EUR'::text,
  updated_by text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT t_material_prices_pkey PRIMARY KEY (material_id),
  CONSTRAINT t_material_prices_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.t_materials(material_id)
);
CREATE TABLE public.t_materials (
  material_id text NOT NULL,
  name text NOT NULL,
  unit text NOT NULL,
  category text,
  vat_rate numeric DEFAULT 19.00,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  default_quantity numeric,
  CONSTRAINT t_materials_pkey PRIMARY KEY (material_id)
);
CREATE TABLE public.t_morningplan (
  plan_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  plan_date date NOT NULL,
  project_id uuid,
  vehicle_id text,
  start_time time without time zone,
  service_type text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  angebotsart text,
  vehicle_names text,
  CONSTRAINT t_morningplan_pkey PRIMARY KEY (plan_id),
  CONSTRAINT t_morningplan_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.t_projects(project_id),
  CONSTRAINT t_morningplan_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.t_vehicles(vehicle_id)
);
CREATE TABLE public.t_morningplan_staff (
  id bigint NOT NULL DEFAULT nextval('t_morningplan_staff_id_seq'::regclass),
  plan_id uuid,
  employee_id uuid,
  role text,
  created_at timestamp with time zone DEFAULT now(),
  individual_start_time time without time zone,
  member_notes text,
  sort_order integer DEFAULT 0,
  CONSTRAINT t_morningplan_staff_pkey PRIMARY KEY (id),
  CONSTRAINT t_morningplan_staff_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.t_employees(employee_id),
  CONSTRAINT t_morningplan_staff_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.t_morningplan(plan_id)
);
CREATE TABLE public.t_project_costs_extra (
  cost_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  project_id uuid,
  cost_type text NOT NULL,
  description text,
  cost numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  phase text DEFAULT 'Nachkalkulation'::text,
  CONSTRAINT t_project_costs_extra_pkey PRIMARY KEY (cost_id),
  CONSTRAINT t_project_costs_extra_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.t_projects(project_id)
);
CREATE TABLE public.t_project_discounts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  project_id uuid,
  target text NOT NULL,
  mode text NOT NULL,
  value numeric NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT t_project_discounts_pkey PRIMARY KEY (id),
  CONSTRAINT t_project_discounts_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.t_projects(project_id)
);
CREATE TABLE public.t_project_material_usage (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  project_id uuid,
  material_id text,
  quantity numeric NOT NULL DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  phase text DEFAULT 'Nachkalkulation'::text,
  inspection_id uuid,
  CONSTRAINT t_project_material_usage_pkey PRIMARY KEY (id),
  CONSTRAINT t_project_material_usage_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.t_materials(material_id),
  CONSTRAINT t_project_material_usage_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.t_projects(project_id)
);
CREATE TABLE public.t_project_note_media (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  field_key text NOT NULL,
  mode text NOT NULL,
  text_value text,
  image_base64 text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT t_project_note_media_pkey PRIMARY KEY (id),
  CONSTRAINT t_project_note_media_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.t_projects(project_id)
);
CREATE TABLE public.t_project_revenue_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid,
  position_label text NOT NULL,
  qty numeric NOT NULL,
  unit text,
  unit_price numeric NOT NULL,
  line_total numeric,
  kind text NOT NULL DEFAULT 'manual'::text,
  source_inspection_id uuid,
  sort_order integer,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT t_project_revenue_items_pkey PRIMARY KEY (id),
  CONSTRAINT t_project_revenue_items_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.t_projects(project_id),
  CONSTRAINT t_project_revenue_items_source_inspection_id_fkey FOREIGN KEY (source_inspection_id) REFERENCES public.t_inspections(inspection_id)
);
CREATE TABLE public.t_project_vehicle_costs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid,
  vehicle_id text,
  usage_type text NOT NULL,
  usage_value numeric NOT NULL,
  cost_per_unit numeric,
  total_cost numeric,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT t_project_vehicle_costs_pkey PRIMARY KEY (id),
  CONSTRAINT t_project_vehicle_costs_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.t_projects(project_id),
  CONSTRAINT t_project_vehicle_costs_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.t_vehicles(vehicle_id)
);
CREATE TABLE public.t_projects (
  project_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  project_code text UNIQUE,
  anrede text,
  name text,
  strasse text,
  nr text,
  plz text,
  ort text,
  telefon text,
  email text,
  notes text,
  status text DEFAULT 'In Planung'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  dienstleistungen text,
  project_date date,
  project_time time without time zone,
  offer_type text,
  project_start_date date,
  project_end_date date,
  CONSTRAINT t_projects_pkey PRIMARY KEY (project_id)
);
CREATE TABLE public.t_service_prices (
  price_id text NOT NULL,
  service_id text NOT NULL,
  supplier text NOT NULL,
  unit text,
  cost_per_unit numeric,
  customer_price_per_unit numeric,
  CONSTRAINT t_service_prices_pkey PRIMARY KEY (price_id),
  CONSTRAINT t_service_prices_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.t_services(service_id)
);
CREATE TABLE public.t_services (
  service_id text NOT NULL,
  name text NOT NULL,
  default_unit text,
  category text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone,
  CONSTRAINT t_services_pkey PRIMARY KEY (service_id)
);
CREATE TABLE public.t_time_pairs (
  id integer NOT NULL DEFAULT nextval('t_time_pairs_id_seq'::regclass),
  pair_id text NOT NULL UNIQUE,
  project_id uuid,
  datum date NOT NULL,
  mitarbeiter text NOT NULL,
  lis_von time without time zone,
  lis_bis time without time zone,
  kunde_von time without time zone,
  kunde_bis time without time zone,
  pause_min integer DEFAULT 0,
  ges_lis_h numeric DEFAULT 
CASE
    WHEN ((lis_von IS NOT NULL) AND (lis_bis IS NOT NULL)) THEN ((EXTRACT(epoch FROM (lis_bis - lis_von)) / (3600)::numeric) - ((pause_min)::numeric / 60.0))
    ELSE (0)::numeric
END,
  ges_kd_h numeric DEFAULT 
CASE
    WHEN ((kunde_von IS NOT NULL) AND (kunde_bis IS NOT NULL)) THEN (EXTRACT(epoch FROM (kunde_bis - kunde_von)) / (3600)::numeric)
    ELSE (0)::numeric
END,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  employee_id uuid,
  abnahme_id uuid,
  plan_id uuid,
  staff_id uuid,
  employee_name text,
  employee_code text,
  pause text,
  ges_lis text,
  ges_kd text,
  notes text,
  CONSTRAINT t_time_pairs_pkey PRIMARY KEY (id),
  CONSTRAINT t_time_pairs_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.t_employees(employee_id),
  CONSTRAINT t_time_pairs_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.t_projects(project_id)
);
CREATE TABLE public.t_users (
  user_id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  role text NOT NULL CHECK (role = ANY (ARRAY['Admin'::text, 'Secretary'::text, 'Planner'::text, 'Supervisor'::text, 'Worker'::text])),
  user_type text NOT NULL CHECK (user_type = ANY (ARRAY['office'::text, 'field'::text])),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  dashboard_only boolean NOT NULL DEFAULT false,
  employee_id uuid,
  CONSTRAINT t_users_pkey PRIMARY KEY (user_id),
  CONSTRAINT t_users_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.t_employees(employee_id)
);
CREATE TABLE public.t_vehicle_daily_status (
  id integer NOT NULL DEFAULT nextval('t_vehicle_daily_status_id_seq'::regclass),
  vehicle_name text NOT NULL,
  status text DEFAULT ''::text,
  informationen text DEFAULT ''::text,
  plan_date date NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  vehicle_id text,
  CONSTRAINT t_vehicle_daily_status_pkey PRIMARY KEY (id),
  CONSTRAINT t_vehicle_daily_status_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.t_vehicles(vehicle_id)
);
CREATE TABLE public.t_vehicle_inventory (
  id integer NOT NULL DEFAULT nextval('t_vehicle_inventory_id_seq'::regclass),
  vehicle_id text,
  inventory_date date,
  contents text,
  reported_by text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT t_vehicle_inventory_pkey PRIMARY KEY (id),
  CONSTRAINT t_vehicle_inventory_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.t_vehicles(vehicle_id)
);
CREATE TABLE public.t_vehicle_rates (
  vehicle_id text NOT NULL,
  cost_per_unit numeric,
  gas_cost_per_unit numeric,
  price_per_unit numeric,
  gas_price_per_unit numeric,
  currency text DEFAULT 'EUR'::text,
  updated_by text,
  updated_at timestamp with time zone DEFAULT now(),
  total_cost_per_unit numeric DEFAULT (COALESCE(cost_per_unit, (0)::numeric) + COALESCE(gas_cost_per_unit, (0)::numeric)),
  total_price_per_unit numeric DEFAULT (COALESCE(price_per_unit, (0)::numeric) + COALESCE(gas_price_per_unit, (0)::numeric)),
  CONSTRAINT t_vehicle_rates_pkey PRIMARY KEY (vehicle_id),
  CONSTRAINT t_vehicle_rates_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.t_vehicles(vehicle_id)
);
CREATE TABLE public.t_vehicles (
  vehicle_id text NOT NULL,
  nickname text,
  unit text DEFAULT 'Tag'::text,
  status text DEFAULT 'bereit'::text,
  inhalt text,
  notes text,
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT t_vehicles_pkey PRIMARY KEY (vehicle_id)
);
CREATE TABLE public.t_work_assignments (
  assignment_id uuid NOT NULL DEFAULT gen_random_uuid(),
  work_type character varying NOT NULL,
  employee_name character varying NOT NULL,
  employee_code character varying,
  assignment_date date NOT NULL,
  start_time time without time zone,
  end_time time without time zone,
  hours_estimated numeric,
  status character varying DEFAULT 'Geplant'::character varying,
  notes text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  break_minutes integer DEFAULT 0,
  CONSTRAINT t_work_assignments_pkey PRIMARY KEY (assignment_id)
);
CREATE TABLE public.t_worker_ratings (
  rating_id text NOT NULL,
  project_id text NOT NULL,
  plan_id text NOT NULL,
  employee_id text NOT NULL,
  employee_name text,
  datum date NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 10),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT t_worker_ratings_pkey PRIMARY KEY (rating_id)
);