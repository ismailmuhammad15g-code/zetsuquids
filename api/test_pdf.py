from generate-pdf import create_pdf

result = create_pdf({
    'title': 'Test Arabic',
    'content': 'مرحبا بالعالم',
    'publisher_name': 'Test'
})
print('PDF created, size:', len(result))