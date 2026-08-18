import {type MetaFunction, useLocation} from 'react-router';
import DocsLayout from '~/components/docs/DocsLayout';

export const meta: MetaFunction = () => {
  const canonical = 'https://legendary-branding.com/docs/phase6-codegen-changelog';
  return [
    {title: 'Phase 6 — Codegen & GraphQL Validation — LEGENDARY BRANDING'},
    {name: 'description', content: 'Real type-safety gate for Storefront + Customer Account GraphQL. Fixes account mutation bugs that could never be caught before.'},
    {tagName: 'link', rel: 'canonical', href: canonical},
    {property: 'og:title', content: 'Phase 6 — Codegen & GraphQL Validation'},
    {property: 'og:description', content: 'Type-safety gate for Storefront + Customer Account GraphQL.'},
    {property: 'og:url', content: canonical},
  ];
};

function SectionHeading({id, children}: {id: string; children: React.ReactNode}) {
  return (
    <h2
      id={id}
      className="font-serif text-3xl text-[#1A1A1A] mt-16 mb-6 pb-3 border-b border-[#E8E6E1] scroll-mt-24"
    >
      {children}
    </h2>
  );
}

function SubHeading({id, children}: {id: string; children: React.ReactNode}) {
  return (
    <h3
      id={id}
      className="font-serif text-xl text-[#1A1A1A] mt-8 mb-4 scroll-mt-24"
    >
      {children}
    </h3>
  );
}

function P({children}: {children: React.ReactNode}) {
  return <p className="text-[#1A1A1A]/80 leading-relaxed mb-4">{children}</p>;
}

function InlineCode({children}: {children: React.ReactNode}) {
  return (
    <code className="px-1.5 py-0.5 bg-[#F3F2EE] text-sm text-[#FF3B30] rounded font-mono">
      {children}
    </code>
  );
}

function CodeBlock({children}: {children: React.ReactNode}) {
  return (
    <pre className="bg-[#1A1A1A] text-[#FAF9F6] p-5 rounded-lg text-sm overflow-x-auto mb-6 font-mono leading-relaxed">
      {children}
    </pre>
  );
}

function Note({children}: {children: React.ReactNode}) {
  return (
    <div className="border-l-4 border-[#FF3B30] bg-[#FF3B30]/5 p-5 rounded-r-lg mb-6">
      <p className="text-sm text-[#1A1A1A] leading-relaxed m-0">{children}</p>
    </div>
  );
}

function DocTable({headers, rows}: {headers: string[]; rows: string[][]}) {
  return (
    <div className="overflow-x-auto mb-6">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-[#E8E6E1]">
            {headers.map((h) => (
              <th key={h} className="text-left h-eyebrow text-[#9E9C97] py-3 pr-4 font-normal first:pl-0">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-[#E8E6E1]/50">
              {row.map((cell, j) => (
                <td key={j} className="py-3 pr-4 text-[#1A1A1A]/80 first:pl-0">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Phase6CodegenPage() {
  const location = useLocation();

  return (
    <DocsLayout currentPath={location.pathname}>
      <div>
        <p className="h-eyebrow text-[#FF3B30] mb-4">PHASE 6</p>
        <h1 className="font-serif text-4xl md:text-5xl font-normal text-[#1A1A1A] mb-4 leading-tight">
          Codegen &amp; GraphQL Validation
        </h1>
        <p className="text-lg text-[#6B6B6B] leading-relaxed mb-8 max-w-2xl">
          Real type-safety gate for Storefront + Customer Account GraphQL —
          fixing the DB-level bugs that could never be caught before this phase.
        </p>

        <SectionHeading id="overview">Overview</SectionHeading>
        <P>
          Phase 6 turns <InlineCode>npm run codegen</InlineCode> into a real CI
          gate that validates <strong>every GraphQL document</strong> against the
          correct API schema, and fixes the class of bugs that gate exists to
          catch.
        </P>
        <P>
          <strong>Before:</strong> the <InlineCode>.d.ts</InlineCode> files were
          6-line empty stubs, CI's codegen step was{' '}
          <InlineCode>continue-on-error: true</InlineCode> (never blocked
          anything), and nothing validated GraphQL until runtime.
        </P>
        <P>
          <strong>Now:</strong> codegen validates every Storefront and Customer
          Account query/mutation against the correct schema in CI on every push.
          Invalid GraphQL fails the job and blocks the PR. The account mutations
          were corrected to the real schema (details below).
        </P>

        <SectionHeading id="config-fix">1. Codegen Configuration Fix</SectionHeading>
        <P>
          <strong>File:</strong> <InlineCode>.graphqlrc.ts</InlineCode> defines two
          projects — <InlineCode>default</InlineCode> (Storefront schema) and{' '}
          <InlineCode>customer</InlineCode> (Customer Account schema).
        </P>
        <P>
          <strong>Bug fixed:</strong>{' '}
          <InlineCode>app/routes/api.wishlist.ts</InlineCode> uses Customer Account
          mutations but was matched by the Storefront project's document globs.
          Its mutations were validated against the wrong schema and always failed.
        </P>
        <P>
          <strong>Change:</strong> excluded <InlineCode>api.wishlist.ts</InlineCode>{' '}
          from the <InlineCode>default</InlineCode> project and added it to the{' '}
          <InlineCode>customer</InlineCode> project. Now each document goes to the
          schema it actually uses.
        </P>

        <SectionHeading id="mutation-fixes">2. Mutation Corrections (caught by codegen)</SectionHeading>

        <SubHeading id="wishlist">Wishlist sync — api.wishlist.ts</SubHeading>
        <P>
          The Phase 5 implementation wrote the wishlist metafield via{' '}
          <InlineCode>customerUpdate(customer: {"{ metafields }"})</InlineCode> — a
          Storefront shape. The Customer Account API has no{' '}
          <InlineCode>metafields</InlineCode> field on{' '}
          <InlineCode>CustomerUpdateInput</InlineCode> and instead provides the
          dedicated <InlineCode>metafieldsSet</InlineCode> mutation.
        </P>
        <P>
          <strong>Fix:</strong> the write path now queries the customer{' '}
          <InlineCode>id</InlineCode>, then calls{' '}
          <InlineCode>metafieldsSet</InlineCode> with{' '}
          <InlineCode>{"{ ownerId, namespace, key, type: "}json{", value }"}</InlineCode>.
        </P>

        <SubHeading id="addresses">Address CRUD — account.addresses.tsx</SubHeading>
        <DocTable
          headers={['Issue', 'Was', 'Fixed to']}
          rows={[
            ['Input type', 'MailingAddressInput', 'CustomerAddressInput'],
            ['Update arg', '$id / id', '$addressId / addressId'],
            ['Delete arg', '$id / id', '$addressId / addressId'],
            ['Delete return', 'deletedCustomerAddressId', 'deletedAddressId'],
          ]}
        />
        <P>
          <strong>Input field mapping:</strong>{' '}
          <InlineCode>CustomerAddressInput</InlineCode> uses{' '}
          <InlineCode>zoneCode</InlineCode> (not <InlineCode>province</InlineCode>)
          and <InlineCode>territoryCode</InlineCode> (not{' '}
          <InlineCode>country</InlineCode>). The action now maps{' '}
          <InlineCode>province</InlineCode> → <InlineCode>zoneCode</InlineCode> and
          derives <InlineCode>territoryCode</InlineCode> from the country field
          (default <InlineCode>US</InlineCode>).
        </P>

        <SubHeading id="profile-edit">Profile edit — account.edit.tsx</SubHeading>
        <P>
          <InlineCode>customerUpdate</InlineCode> in the Customer Account API takes
          its argument as <InlineCode>input</InlineCode>, not{' '}
          <InlineCode>customer</InlineCode>. Fixed the mutation definition and the
          variables call.
        </P>

        <SubHeading id="set-default">Set-default removed — account.addresses.tsx</SubHeading>
        <P>
          Codegen confirmed the Customer Account API has{' '}
          <strong>no</strong> <InlineCode>customerDefaultAddressUpdate</InlineCode>{' '}
          mutation (Storefront-only). The &quot;Set as Default&quot; button and its
          action handler were removed. Default indication remains read-only;
          setting a default via Storefront API is documented as future work.
        </P>

        <SectionHeading id="ci-gate">3. CI Gate — real, not optional</SectionHeading>
        <P>
          <strong>File:</strong>{' '}
          <InlineCode>
            .github/workflows/oxygen-deployment-1000167667.yml
          </InlineCode>
        </P>
        <P>
          Removed <InlineCode>continue-on-error: true</InlineCode> from the codegen
          step and renamed it to &quot;Codegen + GraphQL validation (Storefront
          &amp; Customer Account)&quot;. The step still runs before Build /
          Typecheck / Lint / Test in the same Quality Gate job.
        </P>
        <CodeBlock>{`- name: Codegen + GraphQL validation (Storefront & Customer Account)
  run: npm run codegen
  env:
    PUBLIC_STORE_DOMAIN: <ci secret PUBLIC_STORE_DOMAIN>
    PUBLIC_STOREFRONT_API_TOKEN: <ci secret PUBLIC_STOREFRONT_API_TOKEN>
    SESSION_SECRET: ci-only-do-not-use
  # continue-on-error: true   ← removed`}</CodeBlock>
        <Note>
          This closes the audit&apos;s central finding.{' '}
          <InlineCode>continue-on-error: true</InlineCode> let site-breaking
          GraphQL reach production twice. The same class of error is now a blocked
          PR instead of a live-site outage.
        </Note>

        <SectionHeading id="generated-types">4. Generated Types</SectionHeading>
        <P>
          The committed <InlineCode>.d.ts</InlineCode> files remain empty stubs —
          they populate with real, schema-derived operation types when codegen
          runs against the live store with real CI secrets. The{' '}
          <strong>validation gate</strong> is what runs everywhere (it works
          against the bundled schema JSONs with placeholder tokens). Routes keep
          their explicit TS interfaces, which already pass typecheck.
        </P>

        <SectionHeading id="files">5. Files Changed</SectionHeading>
        <DocTable
          headers={['File', 'Change']}
          rows={[
            ['.graphqlrc.ts', 'Route api.wishlist.ts to the Customer Account project'],
            ['app/routes/api.wishlist.ts', 'Wishlist write via metafieldsSet + ownerId'],
            ['app/routes/account.addresses.tsx', 'Correct input type, arg names, field mapping; removed set-default'],
            ['app/routes/account.edit.tsx', 'customerUpdate uses input arg'],
            ['deployment workflow', 'Codegen is now a real gate'],
          ]}
        />

        <SectionHeading id="checks">6. Checks</SectionHeading>
        <ul className="list-disc pl-5 mb-6 space-y-1 text-[#1A1A1A]/80">
          <li>Codegen passes validation (no GraphQL document errors)</li>
          <li>Typecheck passes (<InlineCode>npm run typecheck</InlineCode>)</li>
          <li>Build passes (<InlineCode>npm run build</InlineCode>)</li>
          <li>Lint passes (<InlineCode>npm run lint</InlineCode>)</li>
        </ul>
      </div>
    </DocsLayout>
  );
}