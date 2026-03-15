const TYPE_MAP = {
  'Casa': 'Residential / Home',
  'Apartamento': 'Residential / Apartment',
  'Terreno': 'Residential / Land Lot',
  'Sobrado': 'Residential / Home',
  'Chácara': 'Residential / Farm Ranch',
  'Cobertura': 'Residential / Penthouse',
  'Studio': 'Residential / Apartment',
  'Sala Comercial': 'Commercial / Building',
};

const MODALITY_MAP = {
  'Venda': 'For Sale',
  'Aluguel': 'For Rent',
  'Venda e Aluguel': 'For Sale',
};

function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function generateZapXML(properties) {
  const listings = properties.map(p => `
    <Listing>
      <ListingID>${escapeXml(p.id)}</ListingID>
      <Title><![CDATA[${p.title || ''}]]></Title>
      <TransactionType>${MODALITY_MAP[p.modality] || 'For Sale'}</TransactionType>
      <PropertyType>${TYPE_MAP[p.type] || 'Residential / Home'}</PropertyType>
      <Description><![CDATA[${p.portal_description || p.description || ''}]]></Description>
      <ListPrice currency="BRL">${p.price || 0}</ListPrice>
      ${p.condominium_fee ? `<PropertyAdministrationFee currency="BRL">${p.condominium_fee}</PropertyAdministrationFee>` : ''}
      ${p.iptu_annual ? `<YearlyTax currency="BRL">${p.iptu_annual}</YearlyTax>` : ''}
      <LotArea unit="square metres">${p.area || 0}</LotArea>
      <LivingArea unit="square metres">${p.area || 0}</LivingArea>
      <Bedrooms>${p.bedrooms || 0}</Bedrooms>
      <Bathrooms>${p.bathrooms || 0}</Bathrooms>
      <Suites>${p.suites || 0}</Suites>
      <Garage type="Parking Spaces">${p.garage || 0}</Garage>
      ${(p.amenities && p.amenities.length > 0) ? `<Features>
        ${p.amenities.map(a => `<Feature>${escapeXml(a)}</Feature>`).join('\n        ')}
      </Features>` : ''}
      <Location>
        <Address>${escapeXml(p.address)}${p.address_number ? `, ${escapeXml(p.address_number)}` : ''}</Address>
        ${p.complement ? `<Complement>${escapeXml(p.complement)}</Complement>` : ''}
        <Neighborhood>${escapeXml(p.neighborhood)}</Neighborhood>
        <City>${escapeXml(p.city || 'Ubatuba')}</City>
        <State>SP</State>
        <Country>BR</Country>
        ${p.zip_code ? `<PostalCode>${escapeXml(p.zip_code)}</PostalCode>` : ''}
      </Location>
      ${(p.images && p.images.length > 0) ? `<Media>
        ${p.images.map((url, i) => `<Item medium="image" caption="Foto ${i + 1}">${escapeXml(url)}</Item>`).join('\n        ')}
      </Media>` : ''}
      ${p.video_url ? `<Videos><Video>${escapeXml(p.video_url)}</Video></Videos>` : ''}
      <ContactInfo>
        <Name>Ícaro Negri</Name>
        <Email>contato@vivabeiramar.com.br</Email>
        <Telephone>(11) 92219-0212</Telephone>
      </ContactInfo>
    </Listing>`).join('');

  return `<?xml version="1.0" encoding="utf-8"?>
<ListingDataFeed xmlns="http://www.vivareal.com/schemas/1.0/VRSync"
                  xsi:schemaLocation="http://www.vivareal.com/schemas/1.0/VRSync"
                  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Header>
    <Provider>Viva Beiramar</Provider>
    <Email>contato@vivabeiramar.com.br</Email>
    <ContactName>Ícaro Negri</ContactName>
    <Telephone>(11) 92219-0212</Telephone>
    <CRECI>221107</CRECI>
  </Header>
  <Listings>${listings}
  </Listings>
</ListingDataFeed>`;
}

export function downloadXML(xmlString, filename = 'imoveis-feed.xml') {
  const blob = new Blob([xmlString], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
