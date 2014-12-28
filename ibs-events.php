<?PHP

/*
  Plugin Name: IBS Events
  Plugin URI: http://wordpress.org/extend/plugins/
  Description: Adds post type IBS Event which is an optional event source for IBS Calendar..
  Author: HMoore71
  Version: 0.1
  Author URI: http://indianbendsolutions.net
  License: GPL2
  License URI: none
 */

/*
  This program is distributed in the hope that it will be useful, but
  WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 */

class IBS_EVENTS {

    static $options = array();

    static function init() {
        self::$options = get_option('ibs_calendar_options');
        if (isset(self::$options['version']) === false) {
            self::$options = array(
                "version" => '0.3',
                "debug" => false,
                "ui_theme" => "cupertino",
                "firstDay" => "1",
                "titleFormat" => "MMM DD, YYYY",
                "timeFormat" => "HH:mm",
                "timeZone" => "local",
            );
        }
        add_action('manage_ibs_event_posts_custom_column', array(__CLASS__, 'custom_columns_content'), 10, 2);
        add_action('save_post', array(__CLASS__, 'save_event_info'));
        add_filter('manage_edit-ibs_event_columns', array(__CLASS__, 'custom_columns_head'), 10);
        add_action('admin_enqueue_scripts', array(__CLASS__, 'admin_script_style'));
        add_action('wp_enqueue_scripts', array(__CLASS__, 'enqueue_scripts'));
        add_action('add_meta_boxes_ibs_event', array(__CLASS__, 'add_event_info_metabox'));
        add_action('init', array(__CLASS__, 'custom_post_type'));
    }

    static function custom_post_type() {
        $labels = array(
            'name' => __('IBS Events', 'ibs'),
            'singular_name' => __('IBS Event', 'ibs'),
            'add_new_item' => __('Add New IBS Event', 'ibs'),
            'all_items' => __('All', 'ibs'),
            'edit_item' => __('Edit IBS Event', 'ibs'),
            'new_item' => __('New', 'ibs'),
            'view_item' => __('View IBS Event', 'ibs'),
            'not_found' => __('No IBS Events Found', 'ibs'),
            'not_found_in_trash' => __('No IBS Events Found in Trash', 'ibs')
        );

        $supports = array(
            'title',
            'editor',
            'excerpt'
        );

        $args = array(
            'label' => __('IBS Events', 'ibs'),
            'labels' => $labels,
            'description' => __('A list of IBS Events', 'ibs'),
            'public' => true,
            'show_in_menu' => true,
            'menu_icon' => plugins_url('css/document.png', __FILE__),
            'has_archive' => true,
            'rewrite' => true,
            'supports' => $supports
        );

        register_post_type('ibs_event', $args);
        flush_rewrite_rules();
    }

    static function add_event_info_metabox() {
        add_meta_box('ibs-event-info-metabox', __('Event Schedule', 'ibs'), array(__CLASS__, 'render_event_info_metabox'), 'ibs_event', 'normal', 'core');
    }

    static function enqueue_scripts() {
        
    }

    static function custom_columns_head($defaults) {
        unset($defaults['date']);
        $defaults['event_start'] = __('Start', 'ibs');
        $defaults['event_end'] = __('End', 'ibs');
        $defaults['event_allday'] = __('All day', 'ibs');
        $defaults['event_repeats'] = __('Repeats', 'ibs');
        return $defaults;
    }

    static $core_handles = array(
        'jquery',
        'json2',
        'jquery-ui-core',
        'jquery-ui-dialog',
        'jquery-ui-datepicker',
        'jquery-ui-widget'
    );

    static function admin_script_style($hook) {
        global $post_type;
        if (( 'post.php' == $hook || 'post-new.php' == $hook ) && ( 'ibs_event' == $post_type )) {

            wp_enqueue_script(self::$core_handles);

            $theme = self::$options['ui_theme'];
            wp_enqueue_style('ibs-calendar-ui-theme-style', plugins_url("css/jquery-ui-themes-1.11.1/themes/$theme/jquery-ui.min.css", __FILE__));

            wp_enqueue_script('ibs-moment-script', plugins_url("js/moment.js", __FILE__));

            wp_enqueue_script('rrule-rrule-script', plugins_url('js/rrule.js', __FILE__));

            wp_enqueue_style('ibs-timepicker-style', plugins_url('css/ibs-timepicker.css', __FILE__));
            wp_enqueue_script('ibs-timepicker-script', plugins_url('js/ibs-timepicker.js', __FILE__));

            wp_enqueue_style('ibs-events-style', plugins_url('css/events.css', __FILE__));
            wp_enqueue_script('ibs-events-script', plugins_url('js/events.js', __FILE__));
        }
    }

    static function render_event_info_metabox($post) {
        wp_nonce_field(basename(__FILE__), 'ibs-event-nonce');

        $event_start = get_post_meta($post->ID, 'ibs-event-start', true);
        $event_start = empty($event_start) ? time() : $event_start;

        $event_end = get_post_meta($post->ID, 'ibs-event-end', true);
        $event_end = empty($event_end) ? $event_start : $event_end;

        $event_allday = get_post_meta($post->ID, 'ibs-event-allday', true);
        $event_allday = empty($event_allday) ? false : $event_allday;

        $event_color = get_post_meta($post->ID, 'ibs-event-color', true);
        $event_color = empty($event_color) ? '#5484ed' : $event_color;

        $event_repeat = get_post_meta($post->ID, 'ibs-event-repeat', true);

        $event_recurr = get_post_meta($post->ID, 'ibs-event-recurr', true);
        $event_recurr = empty($event_recurr) ? false : $event_recurr;

        $event_exceptions = get_post_meta($post->ID, 'ibs-event-exceptions', true);

        $args = get_option('ibs_calendar_options');
        include('lib/event-html.php');
    }

    static function save_event_info($post_id) {
        if (!isset($_POST['post_type']) || 'ibs_event' != $_POST['post_type']) {
            return;
        }
        $is_autosave = wp_is_post_autosave($post_id);
        $is_revision = wp_is_post_revision($post_id);
        $is_valid_nonce = ( isset($_POST['ibs-event-nonce']) && ( wp_verify_nonce($_POST['ibs-event-nonce'], basename(__FILE__)) ) ) ? true : false;
        if ($is_autosave || $is_revision || !$is_valid_nonce) {
            return;
        }
        update_post_meta($post_id, 'ibs-event-start', isset($_POST['ibs-event-start']) ? $_POST['ibs-event-start'] : time());

        update_post_meta($post_id, 'ibs-event-end', isset($_POST['ibs-event-end']) ? $_POST['ibs-event-end'] : time());

        update_post_meta($post_id, 'ibs-event-allday', isset($_POST['ibs-event-allday'])) ? true : false;

        update_post_meta($post_id, 'ibs-event-color', isset($_POST['ibs-event-color']) ? $_POST['ibs-event-color'] : '#5484ed');

        update_post_meta($post_id, 'ibs-event-recurr', isset($_POST['ibs-event-recurr'])) ? true : false;

        update_post_meta($post_id, 'ibs-event-repeat', isset($_POST['ibs-event-repeat']) ? $_POST['ibs-event-repeat'] : '');

        update_post_meta($post_id, 'ibs-event-exceptions', isset($_POST['ibs-event-exceptions']) ? $_POST['ibs-event-exceptions'] : '');
    }

    static function custom_columns_content($column_name, $post_id) {
        switch ($column_name) {
            case 'event_start' :
                $start_date = get_post_meta($post_id, 'ibs-event-start', true);
                $repeats = get_post_meta($post_id, 'ibs-event-recurr', true);
                if ($repeats) {
                    echo get_post_meta($post_id, 'ibs-event-repeat', true);
                } else {
                    echo date('F d, Y', $start_date);
                }
                break;
            case 'event_end' :
                $end_date = get_post_meta($post_id, 'ibs-event-end', true);
                $repeats = get_post_meta($post_id, 'ibs-event-recurr', true);
                if ($repeats) {
                    echo '';
                } else {
                    echo date('F d, Y', $end_date);
                }
                break;
            case 'event_allday' :
                $ans = get_post_meta($post_id, 'ibs-event-allday', true);
                if(empty($ans)){
                    echo '';
                }else{
                    echo 'X';
                }
                break;
            case 'event_repeats' :
                $ans = get_post_meta($post_id, 'ibs-event-recurr', true);
                if(empty($ans)){
                    echo '';
                }else{
                    echo 'X';
                }
                break;
        }
    }

}

IBS_EVENTS::init();

register_activation_hook(__FILE__, array('IBS_EVENTS', 'custom_post_type'));
