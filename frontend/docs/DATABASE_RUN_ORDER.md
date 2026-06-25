# EventHub 360 — Database Setup Run Order

Run ALL files in pgAdmin (or psql) connected to `eventhub_demo` as the **postgres** superuser.
`eventhub_dev` is READ-ONLY and cannot create tables.

## Run Order

| Step | File | Module | Tables Created |
|------|------|--------|----------------|
| 1 | STEP1_Foundation_Tables.sql | Foundation | tenant, company, location, branch, user_account, role, permission, role_permission, user_role, venue, tax_rule, numbering_scheme, audit_log |
| 2 | STEP2_CRM_Module1_Tables.sql | CRM | account, contact, lead_source, pipeline_stage, lead, lead_activity, task |
| 3 | STEP3_Quotation_Module2.sql | Quotation | price_book, rate_card, package, quotation, quotation_line, quote_approval |
| 4 | STEP4_Booking_Module3.sql | Booking | booking, booking_hold, deposit_schedule, change_order, cancellation |
| 5 | STEP5_Event_Module4.sql | Event Ops | event, event_phase, event_task, run_of_show, crew_allocation, incident, feedback |
| 6 | STEP6_Wedding_Module5.sql | Wedding | wedding_workspace, function, wedding_package, family_group, hospitality_desk, moodboard |
| 7 | STEP7_Guest_Module6.sql | Guest Mgmt | guest, guest_group, event_guest, rsvp, seating, meal_pref, guest_checkin |
| 8 | STEP8_Vendor_Module7.sql | Vendor | vendor_category, vendor, vendor_service, event_vendor, purchase_order, vendor_invoice, vendor_rating |
| 9 | STEP9_Transport_Module8.sql | Transport | vehicle, driver, guide, trip, trip_passenger, transport_cost |
| 10 | STEP10_Hotel_Module9.sql | Hotel | property, room_type, hotel_room, rate_plan, room_block, reservation, folio, folio_line, housekeeping |
| 11 | STEP11_Banquet_Module10.sql | Banquet | banquet_hall, beo, banquet_menu, setup_layout, banquet_addon, banquet_billing |
| 12 | STEP12_Tourism_Module11.sql | Tourism | tour_package, itinerary_day, itinerary_item, departure, tour_booking, traveller, voucher |
| 13 | STEP13_Finance_Module12.sql | Finance | invoice, invoice_line, payment, expense, payout, credit_note, pnl |
| 14 | STEP14_Analytics_Module13.sql | Analytics | dashboard, report_def, kpi_target, scheduled_report |
| 15 | STEP15_AI_Module14.sql | AI Platform | ai_config, ai_request, ai_recommendation, embedding_index, ai_usage |
| 16 | STEP16_Marketplace_Module15.sql | Marketplace | mkt_listing, mkt_enquiry, mkt_order, commission, mkt_review |
| 17 | STEP17_Notification_Module16.sql | Notifications | notification_template, channel_config, notification, delivery_log, reminder_rule |
| 18 | STEP18_Document_Module17.sql | Documents | document, document_version, esign, doc_template |
| 19 | STEP19_WhiteLabel_Module18.sql | White-Label | plan, subscription, branding, usage_meter, tenant_config |
| 20 | STEP20_Portal_Module19.sql | Portals | portal_user, portal_session, portal_request, device_token, offline_sync |
| 21 | STEP21_Admin_Module20.sql | Admin Config | workflow_def, workflow_step, integration, master_data |
| 22 | STEP22_SeedData.sql | Seed Data | Inserts demo tenant, company, user, roles, plans, master data |

## Total: 130+ tables across 20 modules

## Connection Details

```
Host:     135.235.157.63
Port:     5432
Database: eventhub_demo
User:     postgres  (superuser — for creating tables)
User:     eventhub_dev  (read-only — for the app to read data)
```

## How to Run in pgAdmin

1. Open pgAdmin → connect to `eventhub_demo`
2. Open Query Tool
3. Open each STEP file in order
4. Click **Execute (F5)**
5. Check output for errors before running the next step

## How to Run via psql (terminal)

```bash
for i in $(seq -w 1 22); do
  FILE=$(ls STEP${i}_*.sql 2>/dev/null | head -1)
  [ -n "$FILE" ] && psql -h 135.235.157.63 -U postgres -d eventhub_demo -f "$FILE"
done
```

## Design Rules (all tables follow these)

- BIGSERIAL primary keys
- Every table has `is_active BOOLEAN DEFAULT TRUE`
- Money fields use `DECIMAL(14,2)`
- Timestamps use `TIMESTAMPTZ`
- FK to masters: `ON DELETE RESTRICT`
- FK to owned child rows: `ON DELETE CASCADE`
