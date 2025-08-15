import 'package:flutter_test/flutter_test.dart';
import 'package:network_image_mock/network_image_mock.dart';
import 'package:companion/main.dart';

void main() {
  testWidgets('Login screen smoke test', (WidgetTester tester) async {
    mockNetworkImagesFor(() async {
      // Build our app and trigger a frame.
      await tester.pumpWidget(const AmraThemeApp());

      // Verify that our app shows the login screen.
      expect(find.text('Get unlimited access to all features'), findsOneWidget);
    });
  });
}