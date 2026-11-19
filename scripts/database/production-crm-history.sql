-- Private list projection. The caller passes the authenticated employee's Auth ID.
-- Old AET remains the writer. No base-table grants or data copying are required.
CREATE FUNCTION aet.crm_history(staff_id uuid)
RETURNS TABLE (
  kind text, id uuid, name text, email text, office text, "intakeVersion" integer,
  status text, payment_status text, created_at timestamptz, updated_at timestamptz,
  purpose text, country text, amount integer, service text, "mailDelivery" boolean,
  educations jsonb, files jsonb, payments jsonb
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $history$
  WITH staff AS (
    SELECT s.offices, s.include_unassigned FROM aet_private.staff_accounts s
    WHERE s.auth_user_id = staff_id AND s.active
  ), applications AS (
    SELECT 'formal' AS kind, a.id, a.pronouns, a.first_name, a.middle_name, a.last_name,
      a.email, a.office, a.status, a.payment_status, a.created_at, a.updated_at, a.purpose,
      a.country, a.due_amount, a.service_type, a.delivery_method
    FROM public.fce_applications a JOIN staff s ON
      a.office = ANY(s.offices) OR (a.office IS NULL AND s.include_unassigned)
    UNION ALL
    SELECT 'external', a.id, NULL, a.first_name, a.middle_name, a.last_name, NULL,
      a.office, a.status, a.payment_status, a.created_at, a.updated_at, a.purpose,
      NULL, a.due_amount, NULL, NULL
    FROM public.fce_external_orders a JOIN staff s ON
      a.office = ANY(s.offices) OR (a.office IS NULL AND s.include_unassigned)
    UNION ALL
    SELECT 'preeval', a.id, NULL, a.first_name, a.middle_name, a.last_name, a.email,
      NULL, a.status, NULL, a.created_at, a.updated_at, a.purpose, NULL, NULL, NULL, NULL
    FROM public.aet_core_applications a JOIN staff s ON s.include_unassigned
  ), education AS (
    SELECT 'formal' AS kind, e.id, e.application_id, e.school_name, e.country_of_study,
      e.degree_obtained, e.study_start_date, e.study_end_date FROM public.fce_educations e
    UNION ALL
    SELECT 'preeval', e.id, e.application_id, e.school_name, e.country_of_study,
      e.degree_obtained, e.study_start_date, e.study_end_date FROM public.aet_core_educations e
  )
  SELECT a.kind, a.id, coalesce(nullif(concat_ws(' ',
    CASE lower(rtrim(a.pronouns,'.')) WHEN 'mr' THEN 'Mr.' WHEN 'ms' THEN 'Ms.'
      WHEN 'mx' THEN 'Mx.' ELSE nullif(trim(a.pronouns),'') END,
    nullif(trim(a.first_name),''), nullif(trim(a.middle_name),''), nullif(trim(a.last_name),'')
  ),''),'Name not recorded'), coalesce(a.email,''), a.office, 1,
    coalesce(a.status, 'unknown'), coalesce(a.payment_status, history.preferred_status, 'unknown'), a.created_at,
    a.updated_at, coalesce(a.purpose,''), coalesce(a.country,''),
    round(coalesce(a.due_amount, history.preferred_amount) * 100)::integer,
    CASE a.kind WHEN 'external' THEN 'Imported order' WHEN 'preeval' THEN 'Pre-Evaluation'
      ELSE coalesce(nullif(concat_ws(', ',
        CASE WHEN coalesce(nullif(a.service_type #>> '{foreignCredentialEvaluation,firstDegree,speed}',''),nullif(a.service_type #>> '{foreignCredentialEvaluation,speed}','')) IS NOT NULL THEN 'Document by Document' END,
        CASE WHEN coalesce(nullif(a.service_type #>> '{coursebyCourse,firstDegree,speed}',''),nullif(a.service_type #>> '{coursebyCourse,speed}','')) IS NOT NULL THEN 'Course by Course' END,
        CASE WHEN coalesce(nullif(a.service_type #>> '{professionalExperience,firstDegree,speed}',''),nullif(a.service_type #>> '{professionalExperience,speed}','')) IS NOT NULL THEN 'Expert Opinion Letter' END,
        CASE WHEN coalesce(nullif(a.service_type #>> '{positionEvaluation,firstDegree,speed}',''),nullif(a.service_type #>> '{positionEvaluation,speed}','')) IS NOT NULL THEN 'Position Evaluation' END,
        CASE WHEN a.service_type #>> '{translation,required}' = 'true' THEN 'Translation' END,
        CASE WHEN a.service_type #>> '{customizedService,required}' = 'true' THEN 'Customized Evaluation' END
      ),''),'Formal evaluation') END,
    coalesce(a.delivery_method,'') NOT IN ('','no_delivery_needed'),
    coalesce((SELECT jsonb_agg(jsonb_build_object('degree',e.degree_obtained,'school',e.school_name,
      'country',e.country_of_study,'start',concat_ws('-',e.study_start_date->>'year',e.study_start_date->>'month'),
      'end',concat_ws('-',e.study_end_date->>'year',e.study_end_date->>'month')) ORDER BY e.id)
      FROM education e WHERE e.application_id=a.id AND e.kind=a.kind),'[]'::jsonb),
    '[]'::jsonb, coalesce(history.payments,'[]'::jsonb)
  FROM applications a
  LEFT JOIN LATERAL (
    SELECT (array_agg(p.payment_status ORDER BY (p.payment_status='paid') DESC NULLS LAST, p.paid_at DESC NULLS LAST, p.id))[1] preferred_status,
      (array_agg(p.due_amount ORDER BY (p.payment_status='paid') DESC NULLS LAST, p.paid_at DESC NULLS LAST, p.id))[1] preferred_amount,
      jsonb_agg(jsonb_build_object('id',p.id,'session_id',p.payment_id,'amount_cents',round(p.due_amount*100)::integer,
        'status',p.payment_status,'created_at',p.paid_at) ORDER BY p.paid_at DESC NULLS LAST,p.id) payments
    FROM public.aet_core_payments p WHERE a.kind='preeval' AND p.application_id=a.id
  ) history ON true
$history$;

REVOKE ALL ON FUNCTION aet.crm_history(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION aet.crm_history(uuid) TO aet_runtime;
