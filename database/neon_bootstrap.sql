--
-- PostgreSQL database dump
--

\restrict rafDnWxuvmZzXjkohRYiPVHsULsALnX8sjshbXnU6RlFYavJkYazMsfzUhYXx9m

-- Dumped from database version 15.18 (Homebrew)
-- Dumped by pg_dump version 15.18 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: fin_set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fin_set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: branch; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.branch (
    branch_id bigint NOT NULL,
    company_id bigint,
    name character varying(120),
    city character varying(80)
);


--
-- Name: branch_branch_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.branch_branch_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: branch_branch_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.branch_branch_id_seq OWNED BY public.branch.branch_id;


--
-- Name: company; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.company (
    company_id bigint NOT NULL,
    tenant_id bigint,
    name character varying(150),
    gstin character varying(15),
    pan character varying(10),
    base_currency character(3) DEFAULT 'INR'::bpchar
);


--
-- Name: company_company_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.company_company_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: company_company_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.company_company_id_seq OWNED BY public.company.company_id;


--
-- Name: credit_note; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.credit_note (
    credit_note_id bigint NOT NULL,
    tenant_id bigint NOT NULL,
    company_id bigint NOT NULL,
    branch_id bigint,
    invoice_id bigint NOT NULL,
    amount numeric(14,2) NOT NULL,
    reason character varying(160) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by bigint,
    updated_by bigint,
    is_active boolean DEFAULT true NOT NULL,
    CONSTRAINT credit_note_amount_check CHECK ((amount > (0)::numeric))
);


--
-- Name: credit_note_credit_note_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.credit_note_credit_note_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: credit_note_credit_note_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.credit_note_credit_note_id_seq OWNED BY public.credit_note.credit_note_id;


--
-- Name: expense; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expense (
    expense_id bigint NOT NULL,
    tenant_id bigint NOT NULL,
    company_id bigint NOT NULL,
    branch_id bigint,
    event_id bigint,
    category character varying(40) NOT NULL,
    description text,
    amount numeric(14,2) NOT NULL,
    receipt_url text,
    status character varying(15) DEFAULT 'pending'::character varying NOT NULL,
    approved_by bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by bigint,
    updated_by bigint,
    is_active boolean DEFAULT true NOT NULL,
    CONSTRAINT expense_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT expense_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'reimbursed'::character varying])::text[])))
);


--
-- Name: expense_expense_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.expense_expense_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: expense_expense_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.expense_expense_id_seq OWNED BY public.expense.expense_id;


--
-- Name: fin_audit_trail; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_audit_trail (
    audit_id bigint NOT NULL,
    tenant_id bigint DEFAULT 1,
    company_id bigint DEFAULT 1,
    user_id character varying(60),
    action character varying(60) NOT NULL,
    entity character varying(60),
    entity_id character varying(60),
    description text,
    severity character varying(15) DEFAULT 'info'::character varying,
    ip_address character varying(45),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: fin_audit_trail_audit_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fin_audit_trail_audit_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fin_audit_trail_audit_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fin_audit_trail_audit_id_seq OWNED BY public.fin_audit_trail.audit_id;


--
-- Name: invoice; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoice (
    invoice_id bigint NOT NULL,
    tenant_id bigint NOT NULL,
    company_id bigint NOT NULL,
    branch_id bigint,
    booking_id bigint,
    invoice_no character varying(30) NOT NULL,
    type character varying(12) DEFAULT 'Tax'::character varying NOT NULL,
    subtotal numeric(14,2) NOT NULL,
    tax_total numeric(14,2) DEFAULT 0 NOT NULL,
    total numeric(14,2) NOT NULL,
    balance numeric(14,2) NOT NULL,
    status character varying(12) DEFAULT 'Draft'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by bigint,
    updated_by bigint,
    is_active boolean DEFAULT true NOT NULL,
    CONSTRAINT invoice_status_check CHECK (((status)::text = ANY ((ARRAY['Draft'::character varying, 'Issued'::character varying, 'Paid'::character varying, 'Overdue'::character varying, 'Cancelled'::character varying])::text[]))),
    CONSTRAINT invoice_type_check CHECK (((type)::text = ANY ((ARRAY['Proforma'::character varying, 'Tax'::character varying])::text[])))
);


--
-- Name: invoice_invoice_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.invoice_invoice_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: invoice_invoice_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.invoice_invoice_id_seq OWNED BY public.invoice.invoice_id;


--
-- Name: invoice_line; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoice_line (
    invoice_line_id bigint NOT NULL,
    tenant_id bigint NOT NULL,
    company_id bigint NOT NULL,
    branch_id bigint,
    invoice_id bigint NOT NULL,
    description character varying(200) NOT NULL,
    qty numeric(10,2) DEFAULT 1 NOT NULL,
    rate numeric(14,2) NOT NULL,
    amount numeric(14,2) NOT NULL,
    tax_rule_id bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by bigint,
    updated_by bigint,
    is_active boolean DEFAULT true NOT NULL,
    CONSTRAINT invoice_line_qty_check CHECK ((qty > (0)::numeric)),
    CONSTRAINT invoice_line_rate_check CHECK ((rate >= (0)::numeric))
);


--
-- Name: invoice_line_invoice_line_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.invoice_line_invoice_line_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: invoice_line_invoice_line_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.invoice_line_invoice_line_id_seq OWNED BY public.invoice_line.invoice_line_id;


--
-- Name: payment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment (
    payment_id bigint NOT NULL,
    tenant_id bigint NOT NULL,
    company_id bigint NOT NULL,
    branch_id bigint,
    invoice_id bigint NOT NULL,
    mode character varying(15) NOT NULL,
    amount numeric(14,2) NOT NULL,
    gateway_ref character varying(60),
    paid_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by bigint,
    updated_by bigint,
    is_active boolean DEFAULT true NOT NULL,
    is_reconciled boolean DEFAULT false NOT NULL,
    matched_invoice_id bigint,
    CONSTRAINT payment_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT payment_mode_check CHECK (((mode)::text = ANY ((ARRAY['UPI'::character varying, 'Card'::character varying, 'Bank'::character varying, 'Cash'::character varying, 'Cheque'::character varying])::text[])))
);


--
-- Name: payment_payment_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payment_payment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payment_payment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payment_payment_id_seq OWNED BY public.payment.payment_id;


--
-- Name: payout; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payout (
    payout_id bigint NOT NULL,
    tenant_id bigint NOT NULL,
    company_id bigint NOT NULL,
    branch_id bigint,
    vendor_invoice_id bigint,
    amount numeric(14,2) NOT NULL,
    status character varying(15) DEFAULT 'scheduled'::character varying NOT NULL,
    scheduled_date date,
    paid_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by bigint,
    updated_by bigint,
    is_active boolean DEFAULT true NOT NULL,
    CONSTRAINT payout_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT payout_status_check CHECK (((status)::text = ANY ((ARRAY['scheduled'::character varying, 'approved'::character varying, 'paid'::character varying])::text[])))
);


--
-- Name: payout_payout_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payout_payout_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payout_payout_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payout_payout_id_seq OWNED BY public.payout.payout_id;


--
-- Name: pnl; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pnl (
    pnl_id bigint NOT NULL,
    tenant_id bigint NOT NULL,
    company_id bigint NOT NULL,
    branch_id bigint,
    event_id bigint,
    revenue numeric(14,2) DEFAULT 0 NOT NULL,
    direct_cost numeric(14,2) DEFAULT 0 NOT NULL,
    margin numeric(14,2) GENERATED ALWAYS AS ((revenue - direct_cost)) STORED,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by bigint,
    updated_by bigint,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: pnl_pnl_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pnl_pnl_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pnl_pnl_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pnl_pnl_id_seq OWNED BY public.pnl.pnl_id;


--
-- Name: tax_rule; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tax_rule (
    tax_rule_id bigint NOT NULL,
    company_id bigint,
    name character varying(60),
    cgst_pct numeric(5,2) DEFAULT 0,
    sgst_pct numeric(5,2) DEFAULT 0,
    igst_pct numeric(5,2) DEFAULT 0,
    hsn_sac character varying(12)
);


--
-- Name: tax_rule_tax_rule_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tax_rule_tax_rule_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tax_rule_tax_rule_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tax_rule_tax_rule_id_seq OWNED BY public.tax_rule.tax_rule_id;


--
-- Name: tenant; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant (
    tenant_id bigint NOT NULL,
    name character varying(150),
    subdomain character varying(80),
    plan character varying(20),
    status character varying(15) DEFAULT 'active'::character varying,
    is_active boolean DEFAULT true
);


--
-- Name: tenant_tenant_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tenant_tenant_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tenant_tenant_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tenant_tenant_id_seq OWNED BY public.tenant.tenant_id;


--
-- Name: user_account; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_account (
    user_id bigint NOT NULL,
    tenant_id bigint,
    company_id bigint,
    email character varying(160),
    password_hash character varying(255),
    full_name character varying(120),
    phone character varying(20),
    mfa_enabled boolean DEFAULT false,
    status character varying(15) DEFAULT 'active'::character varying
);


--
-- Name: user_account_user_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_account_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_account_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_account_user_id_seq OWNED BY public.user_account.user_id;


--
-- Name: vendor_bill; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendor_bill (
    vendor_bill_id bigint NOT NULL,
    tenant_id bigint DEFAULT 1 NOT NULL,
    company_id bigint DEFAULT 1 NOT NULL,
    branch_id bigint,
    bill_number character varying(40) NOT NULL,
    vendor_name character varying(160) NOT NULL,
    category character varying(40) DEFAULT 'miscellaneous'::character varying,
    amount numeric(14,2) DEFAULT 0 NOT NULL,
    gst_amount numeric(14,2) DEFAULT 0 NOT NULL,
    total_amount numeric(14,2) NOT NULL,
    bill_date date,
    due_date date,
    status character varying(15) DEFAULT 'pending'::character varying NOT NULL,
    file_name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by bigint,
    updated_by bigint,
    is_active boolean DEFAULT true NOT NULL,
    CONSTRAINT vendor_bill_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'paid'::character varying, 'overdue'::character varying])::text[])))
);


--
-- Name: vendor_bill_vendor_bill_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.vendor_bill_vendor_bill_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: vendor_bill_vendor_bill_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.vendor_bill_vendor_bill_id_seq OWNED BY public.vendor_bill.vendor_bill_id;


--
-- Name: branch branch_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branch ALTER COLUMN branch_id SET DEFAULT nextval('public.branch_branch_id_seq'::regclass);


--
-- Name: company company_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company ALTER COLUMN company_id SET DEFAULT nextval('public.company_company_id_seq'::regclass);


--
-- Name: credit_note credit_note_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_note ALTER COLUMN credit_note_id SET DEFAULT nextval('public.credit_note_credit_note_id_seq'::regclass);


--
-- Name: expense expense_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense ALTER COLUMN expense_id SET DEFAULT nextval('public.expense_expense_id_seq'::regclass);


--
-- Name: fin_audit_trail audit_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_audit_trail ALTER COLUMN audit_id SET DEFAULT nextval('public.fin_audit_trail_audit_id_seq'::regclass);


--
-- Name: invoice invoice_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice ALTER COLUMN invoice_id SET DEFAULT nextval('public.invoice_invoice_id_seq'::regclass);


--
-- Name: invoice_line invoice_line_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_line ALTER COLUMN invoice_line_id SET DEFAULT nextval('public.invoice_line_invoice_line_id_seq'::regclass);


--
-- Name: payment payment_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment ALTER COLUMN payment_id SET DEFAULT nextval('public.payment_payment_id_seq'::regclass);


--
-- Name: payout payout_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payout ALTER COLUMN payout_id SET DEFAULT nextval('public.payout_payout_id_seq'::regclass);


--
-- Name: pnl pnl_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pnl ALTER COLUMN pnl_id SET DEFAULT nextval('public.pnl_pnl_id_seq'::regclass);


--
-- Name: tax_rule tax_rule_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tax_rule ALTER COLUMN tax_rule_id SET DEFAULT nextval('public.tax_rule_tax_rule_id_seq'::regclass);


--
-- Name: tenant tenant_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant ALTER COLUMN tenant_id SET DEFAULT nextval('public.tenant_tenant_id_seq'::regclass);


--
-- Name: user_account user_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_account ALTER COLUMN user_id SET DEFAULT nextval('public.user_account_user_id_seq'::regclass);


--
-- Name: vendor_bill vendor_bill_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_bill ALTER COLUMN vendor_bill_id SET DEFAULT nextval('public.vendor_bill_vendor_bill_id_seq'::regclass);


--
-- Data for Name: branch; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.branch (branch_id, company_id, name, city) FROM stdin;
1	1	Mumbai HQ	Mumbai
2	1	Delhi Office	Delhi
\.


--
-- Data for Name: company; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.company (company_id, tenant_id, name, gstin, pan, base_currency) FROM stdin;
1	1	Demo Events Pvt Ltd	27AABCU9603R1ZM	AABCU9603R	INR
\.


--
-- Data for Name: credit_note; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.credit_note (credit_note_id, tenant_id, company_id, branch_id, invoice_id, amount, reason, created_at, updated_at, created_by, updated_by, is_active) FROM stdin;
1	1	1	\N	3	15000.00	Service cancellation – partial refund	2026-06-14 13:22:28.179236+05:30	2026-06-24 13:22:28.179236+05:30	1	\N	t
2	1	1	\N	4	8500.00	Billing correction – quantity error	2026-06-19 13:22:28.179236+05:30	2026-06-24 13:22:28.179236+05:30	1	\N	t
\.


--
-- Data for Name: expense; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.expense (expense_id, tenant_id, company_id, branch_id, event_id, category, description, amount, receipt_url, status, approved_by, created_at, updated_at, created_by, updated_by, is_active) FROM stdin;
1	1	1	\N	\N	venue	Conference Hall	25000.00	\N	pending	\N	2026-06-24 13:15:22.645567+05:30	2026-06-24 13:15:22.645567+05:30	1	\N	t
2	1	1	\N	\N	venue	Grand Hyatt Banquet Hall	85000.00	\N	approved	\N	2026-06-04 13:22:28.176377+05:30	2026-06-24 13:22:28.176377+05:30	1	\N	t
3	1	1	\N	\N	logistics	AV Equipment Rental	32000.00	\N	approved	\N	2026-06-06 13:22:28.176377+05:30	2026-06-24 13:22:28.176377+05:30	1	\N	t
4	1	1	\N	\N	food_beverage	Catering – 200 Pax	48000.00	\N	pending	\N	2026-06-19 13:22:28.176377+05:30	2026-06-24 13:22:28.176377+05:30	1	\N	t
5	1	1	\N	\N	travel	Team Travel – Mumbai to Delhi	18500.00	\N	pending	\N	2026-06-21 13:22:28.176377+05:30	2026-06-24 13:22:28.176377+05:30	1	\N	t
6	1	1	\N	\N	decor	Floral & Stage Decoration	27000.00	\N	rejected	\N	2026-05-25 13:22:28.176377+05:30	2026-06-24 13:22:28.176377+05:30	1	\N	t
7	1	1	\N	\N	marketing	Social Media Campaign	15000.00	\N	approved	\N	2026-06-12 13:22:28.176377+05:30	2026-06-24 13:22:28.176377+05:30	1	\N	t
8	1	1	\N	\N	marketing	Button test expense	12345.00	\N	pending	\N	2026-06-27 13:55:40.769567+05:30	2026-06-27 13:55:40.769567+05:30	1	\N	t
\.


--
-- Data for Name: fin_audit_trail; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fin_audit_trail (audit_id, tenant_id, company_id, user_id, action, entity, entity_id, description, severity, ip_address, created_at, is_active) FROM stdin;
1	1	1	1	CREATE_INVOICE	invoice	2	Invoice INV-2026-1000 created	success	\N	2026-06-24 13:15:22.593033+05:30	t
2	1	1	1	RECORD_PAYMENT	payment	2	Payment recorded for invoice 2	success	\N	2026-06-24 13:15:22.618058+05:30	t
3	1	1	1	CREATE_EXPENSE	expense	1	Expense created: venue	success	\N	2026-06-24 13:15:22.648786+05:30	t
4	1	1	1	CREATE_INVOICE	invoice	3	Invoice INV-2026-0001 created	success	\N	2026-06-09 13:22:28.180549+05:30	t
5	1	1	1	SEND_INVOICE	invoice	3	Invoice sent to client	success	\N	2026-06-10 13:22:28.180549+05:30	t
6	1	1	1	RECORD_PAYMENT	payment	3	Payment ₹2,36,000 via Bank	success	\N	2026-04-30 13:22:28.180549+05:30	t
7	1	1	1	APPROVE_EXPENSE	expense	2	Expense approved: venue	success	\N	2026-06-05 13:22:28.180549+05:30	t
8	1	1	1	REJECT_EXPENSE	expense	6	Expense rejected: decor	warning	\N	2026-05-26 13:22:28.180549+05:30	t
9	1	1	1	CREATE_EXPENSE	expense	8	Expense created: marketing	success	\N	2026-06-27 13:55:40.809097+05:30	t
10	1	1	1	UPLOAD_BILL	vendor_bill	4	Vendor bill VB-2026-76031 uploaded	success	\N	2026-06-29 18:01:16.04416+05:30	t
11	1	1	1	UPLOAD_BILL	vendor_bill	5	Vendor bill VB-2026-33626 uploaded	success	\N	2026-06-29 18:03:53.632738+05:30	t
12	1	1	1	APPROVE_PAYOUTS	payout	2	1 payouts approved	success	\N	2026-06-29 18:12:14.574986+05:30	t
13	1	1	1	DISBURSE_PAYOUTS	payout	2	1 payouts disbursed	success	\N	2026-06-29 18:12:14.584923+05:30	t
14	1	1	1	CREATE_EXPENSE	expense	9	Expense created: marketing	success	\N	2026-06-29 23:21:49.350656+05:30	t
15	1	1	1	RECONCILE_ENTRY	payment	1	Matched to invoice 3	success	\N	2026-07-01 12:36:37.70443+05:30	t
16	1	1	1	UNMATCH_ENTRY	payment	1	Reconciliation removed	warning	\N	2026-07-01 12:36:37.774147+05:30	t
17	1	1	1	RECONCILE_ENTRY	payment	2	Matched to invoice 8	success	\N	2026-07-02 00:14:56.256739+05:30	t
18	1	1	1	UNMATCH_ENTRY	payment	2	Reconciliation removed	warning	\N	2026-07-02 00:20:42.114297+05:30	t
19	1	1	1	RECONCILE_ENTRY	payment	2	Matched to invoice 8	success	\N	2026-07-02 00:28:26.747236+05:30	t
\.


--
-- Data for Name: invoice; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.invoice (invoice_id, tenant_id, company_id, branch_id, booking_id, invoice_no, type, subtotal, tax_total, total, balance, status, created_at, updated_at, created_by, updated_by, is_active) FROM stdin;
1	1	1	2	\N	INV-2026-1001	Tax	50000.00	9000.00	59000.00	59000.00	Draft	2026-06-24 13:10:15.06221+05:30	2026-06-27 14:26:17.564962+05:30	1	\N	t
2	1	1	1	\N	INV-2026-1000	Tax	60000.00	10800.00	70800.00	70800.00	Draft	2026-06-24 13:15:22.575755+05:30	2026-06-27 14:26:17.564962+05:30	1	\N	t
3	1	1	2	\N	INV-2026-0001	Tax	150000.00	27000.00	177000.00	177000.00	Issued	2026-06-09 13:22:28.168083+05:30	2026-06-27 14:26:17.564962+05:30	1	\N	t
4	1	1	1	\N	INV-2026-0002	Tax	85000.00	15300.00	100300.00	100300.00	Issued	2026-05-10 13:22:28.168083+05:30	2026-06-27 14:26:17.564962+05:30	1	\N	t
5	1	1	2	\N	INV-2026-0003	Tax	200000.00	36000.00	236000.00	0.00	Paid	2026-04-25 13:22:28.168083+05:30	2026-06-27 14:26:17.564962+05:30	1	\N	t
6	1	1	1	\N	INV-2026-0004	Tax	60000.00	10800.00	70800.00	70800.00	Draft	2026-06-22 13:22:28.168083+05:30	2026-06-27 14:26:17.564962+05:30	1	\N	t
7	1	1	1	\N	INV-2026-0010	Tax	90000.00	16200.00	106200.00	106200.00	Issued	2026-04-18 18:20:31.180845+05:30	2026-04-18 18:20:31.180845+05:30	1	\N	t
8	1	1	1	\N	INV-2026-0011	Tax	60000.00	10800.00	70800.00	70800.00	Issued	2026-03-16 18:20:31.180845+05:30	2026-03-16 18:20:31.180845+05:30	1	\N	t
\.


--
-- Data for Name: invoice_line; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.invoice_line (invoice_line_id, tenant_id, company_id, branch_id, invoice_id, description, qty, rate, amount, tax_rule_id, created_at, updated_at, created_by, updated_by, is_active) FROM stdin;
1	1	1	\N	1	Event Management Services	1.00	50000.00	50000.00	\N	2026-06-24 13:10:15.06221+05:30	2026-06-24 13:10:15.06221+05:30	1	\N	t
2	1	1	\N	2	Stage Setup	2.00	30000.00	60000.00	\N	2026-06-24 13:15:22.575755+05:30	2026-06-24 13:15:22.575755+05:30	1	\N	t
3	1	1	\N	3	Corporate Event Management	1.00	150000.00	150000.00	\N	2026-06-24 13:22:28.173246+05:30	2026-06-24 13:22:28.173246+05:30	1	\N	t
4	1	1	\N	4	Wedding Decoration Package	1.00	85000.00	85000.00	\N	2026-06-24 13:22:28.173246+05:30	2026-06-24 13:22:28.173246+05:30	1	\N	t
5	1	1	\N	5	Product Launch – Full Setup	1.00	200000.00	200000.00	\N	2026-06-24 13:22:28.173246+05:30	2026-06-24 13:22:28.173246+05:30	1	\N	t
6	1	1	\N	6	Birthday Party Package	1.00	60000.00	60000.00	\N	2026-06-24 13:22:28.173246+05:30	2026-06-24 13:22:28.173246+05:30	1	\N	t
\.


--
-- Data for Name: payment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payment (payment_id, tenant_id, company_id, branch_id, invoice_id, mode, amount, gateway_ref, paid_at, created_at, updated_at, created_by, updated_by, is_active, is_reconciled, matched_invoice_id) FROM stdin;
3	1	1	\N	5	Bank	236000.00	UTR20260401123	2026-04-30 13:22:28.175384+05:30	2026-06-24 13:22:28.175384+05:30	2026-06-24 13:22:28.175384+05:30	1	\N	t	f	\N
4	1	1	\N	3	UPI	100000.00	UTR20260515456	2026-06-14 13:22:28.175384+05:30	2026-06-24 13:22:28.175384+05:30	2026-06-24 13:22:28.175384+05:30	1	\N	t	f	\N
1	1	1	\N	1	UPI	59000.00	UTR123456	2026-06-24 05:30:00+05:30	2026-06-24 13:10:24.481841+05:30	2026-07-01 12:36:37.773325+05:30	1	1	t	f	\N
2	1	1	\N	2	Card	70800.00	\N	2026-06-24 05:30:00+05:30	2026-06-24 13:15:22.615029+05:30	2026-07-02 00:28:26.740595+05:30	1	1	t	t	8
\.


--
-- Data for Name: payout; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payout (payout_id, tenant_id, company_id, branch_id, vendor_invoice_id, amount, status, scheduled_date, paid_at, created_at, updated_at, created_by, updated_by, is_active) FROM stdin;
1	1	1	\N	\N	45000.00	scheduled	2026-06-29	\N	2026-06-24 13:22:28.177563+05:30	2026-06-24 13:22:28.177563+05:30	1	\N	t
3	1	1	\N	\N	78000.00	approved	2026-06-26	\N	2026-06-24 13:22:28.177563+05:30	2026-06-24 13:22:28.177563+05:30	1	\N	t
4	1	1	\N	\N	120000.00	paid	2026-06-19	\N	2026-06-24 13:22:28.177563+05:30	2026-06-24 13:22:28.177563+05:30	1	\N	t
2	1	1	\N	\N	32000.00	paid	2026-07-04	2026-06-29 18:12:14.582+05:30	2026-06-24 13:22:28.177563+05:30	2026-06-29 18:12:14.583405+05:30	1	1	t
\.


--
-- Data for Name: pnl; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pnl (pnl_id, tenant_id, company_id, branch_id, event_id, revenue, direct_cost, created_at, updated_at, created_by, updated_by, is_active) FROM stdin;
1	1	1	1	101	250000.00	160000.00	2026-06-29 18:20:31.185422+05:30	2026-06-29 18:20:31.185422+05:30	1	\N	t
2	1	1	1	102	180000.00	120000.00	2026-06-29 18:20:31.185422+05:30	2026-06-29 18:20:31.185422+05:30	1	\N	t
3	1	1	1	103	320000.00	210000.00	2026-06-29 18:20:31.185422+05:30	2026-06-29 18:20:31.185422+05:30	1	\N	t
\.


--
-- Data for Name: tax_rule; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tax_rule (tax_rule_id, company_id, name, cgst_pct, sgst_pct, igst_pct, hsn_sac) FROM stdin;
1	1	GST 18%	9.00	9.00	0.00	998313
2	1	GST 12%	6.00	6.00	0.00	998315
3	1	GST 5%	2.50	2.50	0.00	998312
4	1	IGST 18%	0.00	0.00	18.00	998313
5	1	GST 0%	0.00	0.00	0.00	998310
\.


--
-- Data for Name: tenant; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tenant (tenant_id, name, subdomain, plan, status, is_active) FROM stdin;
1	EventHub Demo	demo	Enterprise	active	t
\.


--
-- Data for Name: user_account; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_account (user_id, tenant_id, company_id, email, password_hash, full_name, phone, mfa_enabled, status) FROM stdin;
1	1	1	admin@demo.in	$2b$10$qz2f75hPDrI1E4YbQPBmhORLUWlK773xo2oxU04dHp4rjU/Ixnnh2	System Admin	\N	f	active
4	1	1	mathurshivv@gmail.com	$2b$10$gjepR3rxaoA3f6O5VMifGOMtQGjd84rVnGGYCHvERo.1PAxeTOSeu	Shivam Mathur	9009232427	f	active
\.


--
-- Data for Name: vendor_bill; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vendor_bill (vendor_bill_id, tenant_id, company_id, branch_id, bill_number, vendor_name, category, amount, gst_amount, total_amount, bill_date, due_date, status, file_name, created_at, updated_at, created_by, updated_by, is_active) FROM stdin;
1	1	1	\N	VB-2026-001	Sound & Stage Co.	logistics	80000.00	14400.00	94400.00	2026-06-19	2026-07-04	pending	\N	2026-06-29 17:58:27.453855+05:30	2026-06-29 17:58:27.453855+05:30	\N	\N	t
2	1	1	\N	VB-2026-002	Bloom Decorators	decor	45000.00	8100.00	53100.00	2026-06-09	2026-06-27	pending	\N	2026-06-29 17:58:27.453855+05:30	2026-06-29 17:58:27.453855+05:30	\N	\N	t
3	1	1	\N	VB-2026-003	Gourmet Caterers	food_beverage	120000.00	6000.00	126000.00	2026-06-24	2026-07-14	approved	\N	2026-06-29 17:58:27.453855+05:30	2026-06-29 17:58:27.453855+05:30	\N	\N	t
\.


--
-- Name: branch_branch_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.branch_branch_id_seq', 2, true);


--
-- Name: company_company_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.company_company_id_seq', 1, true);


--
-- Name: credit_note_credit_note_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.credit_note_credit_note_id_seq', 2, true);


--
-- Name: expense_expense_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.expense_expense_id_seq', 9, true);


--
-- Name: fin_audit_trail_audit_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.fin_audit_trail_audit_id_seq', 19, true);


--
-- Name: invoice_invoice_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.invoice_invoice_id_seq', 8, true);


--
-- Name: invoice_line_invoice_line_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.invoice_line_invoice_line_id_seq', 6, true);


--
-- Name: payment_payment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.payment_payment_id_seq', 4, true);


--
-- Name: payout_payout_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.payout_payout_id_seq', 4, true);


--
-- Name: pnl_pnl_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pnl_pnl_id_seq', 3, true);


--
-- Name: tax_rule_tax_rule_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tax_rule_tax_rule_id_seq', 5, true);


--
-- Name: tenant_tenant_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tenant_tenant_id_seq', 1, true);


--
-- Name: user_account_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_account_user_id_seq', 5, true);


--
-- Name: vendor_bill_vendor_bill_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.vendor_bill_vendor_bill_id_seq', 5, true);


--
-- Name: branch branch_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branch
    ADD CONSTRAINT branch_pkey PRIMARY KEY (branch_id);


--
-- Name: company company_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company
    ADD CONSTRAINT company_pkey PRIMARY KEY (company_id);


--
-- Name: credit_note credit_note_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_note
    ADD CONSTRAINT credit_note_pkey PRIMARY KEY (credit_note_id);


--
-- Name: expense expense_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense
    ADD CONSTRAINT expense_pkey PRIMARY KEY (expense_id);


--
-- Name: fin_audit_trail fin_audit_trail_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_audit_trail
    ADD CONSTRAINT fin_audit_trail_pkey PRIMARY KEY (audit_id);


--
-- Name: invoice invoice_invoice_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT invoice_invoice_no_key UNIQUE (invoice_no);


--
-- Name: invoice_line invoice_line_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_line
    ADD CONSTRAINT invoice_line_pkey PRIMARY KEY (invoice_line_id);


--
-- Name: invoice invoice_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT invoice_pkey PRIMARY KEY (invoice_id);


--
-- Name: payment payment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_pkey PRIMARY KEY (payment_id);


--
-- Name: payout payout_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payout
    ADD CONSTRAINT payout_pkey PRIMARY KEY (payout_id);


--
-- Name: pnl pnl_event_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pnl
    ADD CONSTRAINT pnl_event_id_key UNIQUE (event_id);


--
-- Name: pnl pnl_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pnl
    ADD CONSTRAINT pnl_pkey PRIMARY KEY (pnl_id);


--
-- Name: tax_rule tax_rule_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tax_rule
    ADD CONSTRAINT tax_rule_pkey PRIMARY KEY (tax_rule_id);


--
-- Name: tenant tenant_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant
    ADD CONSTRAINT tenant_pkey PRIMARY KEY (tenant_id);


--
-- Name: tenant tenant_subdomain_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant
    ADD CONSTRAINT tenant_subdomain_key UNIQUE (subdomain);


--
-- Name: user_account user_account_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_account
    ADD CONSTRAINT user_account_email_key UNIQUE (email);


--
-- Name: user_account user_account_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_account
    ADD CONSTRAINT user_account_pkey PRIMARY KEY (user_id);


--
-- Name: vendor_bill vendor_bill_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_bill
    ADD CONSTRAINT vendor_bill_pkey PRIMARY KEY (vendor_bill_id);


--
-- Name: idx_audit_action; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_action ON public.fin_audit_trail USING btree (action);


--
-- Name: idx_audit_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_created ON public.fin_audit_trail USING btree (created_at DESC);


--
-- Name: idx_audit_severity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_severity ON public.fin_audit_trail USING btree (severity);


--
-- Name: idx_credit_note_inv; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_credit_note_inv ON public.credit_note USING btree (invoice_id);


--
-- Name: idx_expense_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expense_company ON public.expense USING btree (company_id);


--
-- Name: idx_expense_event; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expense_event ON public.expense USING btree (event_id) WHERE (event_id IS NOT NULL);


--
-- Name: idx_expense_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expense_status ON public.expense USING btree (status) WHERE is_active;


--
-- Name: idx_inv_line_invoice; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inv_line_invoice ON public.invoice_line USING btree (invoice_id);


--
-- Name: idx_invoice_booking; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoice_booking ON public.invoice USING btree (booking_id) WHERE (booking_id IS NOT NULL);


--
-- Name: idx_invoice_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoice_company ON public.invoice USING btree (company_id);


--
-- Name: idx_invoice_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoice_status ON public.invoice USING btree (status) WHERE is_active;


--
-- Name: idx_payment_invoice; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_invoice ON public.payment USING btree (invoice_id);


--
-- Name: idx_payment_paid_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_paid_at ON public.payment USING btree (paid_at DESC);


--
-- Name: idx_payout_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payout_status ON public.payout USING btree (status) WHERE is_active;


--
-- Name: idx_pnl_event; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pnl_event ON public.pnl USING btree (event_id) WHERE (event_id IS NOT NULL);


--
-- Name: credit_note trg_credit_note_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_credit_note_updated_at BEFORE UPDATE ON public.credit_note FOR EACH ROW EXECUTE FUNCTION public.fin_set_updated_at();


--
-- Name: expense trg_expense_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_expense_updated_at BEFORE UPDATE ON public.expense FOR EACH ROW EXECUTE FUNCTION public.fin_set_updated_at();


--
-- Name: invoice_line trg_invoice_line_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_invoice_line_updated_at BEFORE UPDATE ON public.invoice_line FOR EACH ROW EXECUTE FUNCTION public.fin_set_updated_at();


--
-- Name: invoice trg_invoice_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_invoice_updated_at BEFORE UPDATE ON public.invoice FOR EACH ROW EXECUTE FUNCTION public.fin_set_updated_at();


--
-- Name: payment trg_payment_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_payment_updated_at BEFORE UPDATE ON public.payment FOR EACH ROW EXECUTE FUNCTION public.fin_set_updated_at();


--
-- Name: payout trg_payout_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_payout_updated_at BEFORE UPDATE ON public.payout FOR EACH ROW EXECUTE FUNCTION public.fin_set_updated_at();


--
-- Name: pnl trg_pnl_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_pnl_updated_at BEFORE UPDATE ON public.pnl FOR EACH ROW EXECUTE FUNCTION public.fin_set_updated_at();


--
-- Name: branch branch_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branch
    ADD CONSTRAINT branch_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(company_id) ON DELETE RESTRICT;


--
-- Name: company company_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company
    ADD CONSTRAINT company_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(tenant_id) ON DELETE RESTRICT;


--
-- Name: credit_note credit_note_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_note
    ADD CONSTRAINT credit_note_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branch(branch_id) ON DELETE RESTRICT;


--
-- Name: credit_note credit_note_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_note
    ADD CONSTRAINT credit_note_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(company_id) ON DELETE RESTRICT;


--
-- Name: credit_note credit_note_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_note
    ADD CONSTRAINT credit_note_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_account(user_id);


--
-- Name: credit_note credit_note_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_note
    ADD CONSTRAINT credit_note_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoice(invoice_id) ON DELETE RESTRICT;


--
-- Name: credit_note credit_note_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_note
    ADD CONSTRAINT credit_note_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(tenant_id) ON DELETE RESTRICT;


--
-- Name: credit_note credit_note_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_note
    ADD CONSTRAINT credit_note_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.user_account(user_id);


--
-- Name: expense expense_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense
    ADD CONSTRAINT expense_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.user_account(user_id);


--
-- Name: expense expense_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense
    ADD CONSTRAINT expense_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branch(branch_id) ON DELETE RESTRICT;


--
-- Name: expense expense_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense
    ADD CONSTRAINT expense_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(company_id) ON DELETE RESTRICT;


--
-- Name: expense expense_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense
    ADD CONSTRAINT expense_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_account(user_id);


--
-- Name: expense expense_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense
    ADD CONSTRAINT expense_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(tenant_id) ON DELETE RESTRICT;


--
-- Name: expense expense_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense
    ADD CONSTRAINT expense_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.user_account(user_id);


--
-- Name: invoice invoice_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT invoice_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branch(branch_id) ON DELETE RESTRICT;


--
-- Name: invoice invoice_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT invoice_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(company_id) ON DELETE RESTRICT;


--
-- Name: invoice invoice_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT invoice_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_account(user_id);


--
-- Name: invoice_line invoice_line_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_line
    ADD CONSTRAINT invoice_line_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branch(branch_id) ON DELETE RESTRICT;


--
-- Name: invoice_line invoice_line_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_line
    ADD CONSTRAINT invoice_line_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(company_id) ON DELETE RESTRICT;


--
-- Name: invoice_line invoice_line_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_line
    ADD CONSTRAINT invoice_line_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_account(user_id);


--
-- Name: invoice_line invoice_line_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_line
    ADD CONSTRAINT invoice_line_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoice(invoice_id) ON DELETE CASCADE;


--
-- Name: invoice_line invoice_line_tax_rule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_line
    ADD CONSTRAINT invoice_line_tax_rule_id_fkey FOREIGN KEY (tax_rule_id) REFERENCES public.tax_rule(tax_rule_id) ON DELETE RESTRICT;


--
-- Name: invoice_line invoice_line_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_line
    ADD CONSTRAINT invoice_line_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(tenant_id) ON DELETE RESTRICT;


--
-- Name: invoice_line invoice_line_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_line
    ADD CONSTRAINT invoice_line_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.user_account(user_id);


--
-- Name: invoice invoice_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT invoice_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(tenant_id) ON DELETE RESTRICT;


--
-- Name: invoice invoice_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT invoice_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.user_account(user_id);


--
-- Name: payment payment_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branch(branch_id) ON DELETE RESTRICT;


--
-- Name: payment payment_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(company_id) ON DELETE RESTRICT;


--
-- Name: payment payment_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_account(user_id);


--
-- Name: payment payment_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoice(invoice_id) ON DELETE RESTRICT;


--
-- Name: payment payment_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(tenant_id) ON DELETE RESTRICT;


--
-- Name: payment payment_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.user_account(user_id);


--
-- Name: payout payout_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payout
    ADD CONSTRAINT payout_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branch(branch_id) ON DELETE RESTRICT;


--
-- Name: payout payout_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payout
    ADD CONSTRAINT payout_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(company_id) ON DELETE RESTRICT;


--
-- Name: payout payout_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payout
    ADD CONSTRAINT payout_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_account(user_id);


--
-- Name: payout payout_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payout
    ADD CONSTRAINT payout_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(tenant_id) ON DELETE RESTRICT;


--
-- Name: payout payout_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payout
    ADD CONSTRAINT payout_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.user_account(user_id);


--
-- Name: pnl pnl_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pnl
    ADD CONSTRAINT pnl_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branch(branch_id) ON DELETE RESTRICT;


--
-- Name: pnl pnl_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pnl
    ADD CONSTRAINT pnl_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(company_id) ON DELETE RESTRICT;


--
-- Name: pnl pnl_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pnl
    ADD CONSTRAINT pnl_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_account(user_id);


--
-- Name: pnl pnl_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pnl
    ADD CONSTRAINT pnl_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(tenant_id) ON DELETE RESTRICT;


--
-- Name: pnl pnl_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pnl
    ADD CONSTRAINT pnl_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.user_account(user_id);


--
-- Name: tax_rule tax_rule_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tax_rule
    ADD CONSTRAINT tax_rule_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(company_id) ON DELETE RESTRICT;


--
-- Name: user_account user_account_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_account
    ADD CONSTRAINT user_account_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(company_id);


--
-- Name: user_account user_account_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_account
    ADD CONSTRAINT user_account_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(tenant_id);


--
-- PostgreSQL database dump complete
--

\unrestrict rafDnWxuvmZzXjkohRYiPVHsULsALnX8sjshbXnU6RlFYavJkYazMsfzUhYXx9m

